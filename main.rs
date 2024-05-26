use hyper::{
    service::{make_service_fn, service_fn},
    Body, Method, Request, Response, Server, StatusCode,
};
use std::convert::Infallible;
use std::env;
use std::net::ToSocketAddrs;
use std::sync::Arc;
use tokio::sync::Semaphore;

async fn process_request(req: Request<Body>) -> Result<Response<Body>, Infallible> {
    match (req.method(), req.uri().path()) {
        (&Method::GET, "/stream") => Ok(Response::new(Body::from("Streaming video..."))),
        _ => Ok(Response::builder()
                .status(StatusCode::NOT_FOUND)
                .body(Body::from("404 Not Found"))
                .unwrap_or_else(|_| Response::new(Body::from("Unexpected error creating response"))))
    }
}

#[tokio::main]
async fn main() {
    let server_address_str = env::var("SERVER_ADDR").unwrap_or_else(|_| "127.0.0.1:3000".to_string());
    let server_socket_address = match server_address_str.to_socket_addrs() {
        Ok(mut addresses) => addresses.next().expect("Invalid SERVER_ADDR"),
        Err(_) => {
            eprintln!("Failed to parse SERVER_ADDR.");
            return;
        },
    };

    let max_concurrency_str = env::var("CONCURRENCY_LIMIT")
                            .unwrap_or_else(|_| "100".to_string())
                            .parse::<usize>();
    let request_limit_semaphore = Arc::new(Semaphore::new(match max_concurrency_str {
        Ok(limit) => limit,
        Err(_) => {
            eprintln!("Failed to parse CONCURRENCY_LIMIT.");
            return;
        }
    }));

    let service_factory = make_service_fn(move |_connection| {
        let semaphore_clone = request_limit_semaphore.clone();
        async move {
            Ok::<_, Infallible>(service_fn(move |request| {
                let semaphore_permit_future = semaphore_clone.clone().acquire_owned();
                async move {
                    match semaphore_permit_future.await {
                        Ok(_permit) => process_request(request).await,
                        Err(e) => {
                            eprintln!("Semaphore error: {}", e);
                            Ok(Response::builder()
                                .status(StatusCode::INTERNAL_SERVER_ERROR)
                                .body(Body::from("Server is currently overloaded"))
                                .unwrap_or_else(|_| Response::new(Body::from("Failed to create error response"))))
                        }
                    }
                }
            }))
        }
    });

    let server_instance = Server::bind(&server_socket_address).serve(service_factory);
    println!("Listening on http://{}", server_socket_address);

    if let Err(server_error) = server_instance.await {
        eprintln!("Server error: {}", server_error);
    }
}