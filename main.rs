use hyper::{service::{make_service_fn, service_fn}, Body, Method, Request, Response, Server, StatusCode};
use std::convert::Infallible;
use std::env;
use std::net::ToSocketAddrs;
use std::sync::Arc;
use tokio::sync::Semaphore;

async fn handle_request(req: Request<Body>) -> Result<Response<Body>, Infallible> {
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
    let server_addr = env::var("SERVER_ADDR").unwrap_or_else(|_| "127.0.0.1:3000".to_string());
    let server_addr = match server_addr.to_socket_addrs() {
        Ok(mut addrs) => addrs.next().expect("Invalid SERVER_ADDR"),
        Err(_) => {
            eprintln!("Failed to parse SERVER_ADDR");
            return;
        },
    };

    let concurrency_limit = env::var("CONCURRENCY_LIMIT")
                            .unwrap_or_else(|_| "100".to_string())
                            .parse::<usize>();
    let semaphore = Arc::new(Semaphore::new(match concurrency_limit {
        Ok(limit) => limit,
        Err(_) => {
            eprintln!("Failed to parse CONCURRENCY_LIMIT");
            return;
        }
    }));

    let make_svc = make_service_fn(move |_conn| {
        let semaphore = semaphore.clone();
        async {
            Ok::<_, Infallible>(service_fn(move |req| {
                let permit_future = semaphore.clone().acquire_owned();
                async {
                    match permit_future.await {
                        Ok(_permit) => handle_request(req).await,
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

    let server = Server::bind(&server_addr).serve(make_svc);
    println!("Listening on http://{}", server_addr);

    if let Err(e) = server.await {
        eprintln!("Server error: {}", e);
    }
}