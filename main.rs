use hyper::{service::{make_service_fn, service_fn}, Body, Method, Request, Response, Server, StatusCode};
use std::convert::Infallible;
use std::env;
use std::sync::Arc;
use std::net::ToSocketAddrs;
use tokio::sync::Semaphore;

async fn handle_request(req: Request<Body>) -> Result<Response<Body>, Infallible> {
    match (req.method(), req.uri().path()) {
        (&Method::GET, "/stream") => Ok(Response::new(Body::from("Streaming video..."))),
        _ => Ok(Response::builder()
                .status(StatusCode::NOT_FOUND)
                .body(Body::from("404 Not Found"))
                .unwrap()) // These unwraps are ok because they can only fail if the body is not a string
    }
}

#[tokio::main]
async fn main() {
    let server_addr = env::var("SERVER_ADDR").unwrap_or_else(|_| "127.0.0.1:3000".to_string());
    let server_addr = server_addr.to_socket_addrs()
        .expect("Failed to parse SERVER_ADDR")
        .next()
        .expect("Invalid SERVER_ADDR");

    let concurrency_limit = env::var("CONCURRENCY_LIMIT")
                            .unwrap_or_else(|_| "100".to_string())
                            .parse::<usize>()
                            .expect("Failed to parse CONCURRENCY_LIMIT");
    let semaphore = Arc::new(Semaphore::new(concurrency_limit));

    let make_svc = make_service_fn(move |_conn| {
        let semaphore = semaphore.clone();
        async {
            Ok::<_, Infallible>(service_fn(move |req| {
                let permit_future = semaphore.clone().acquire_owned();
                async {
                    match permit_future.await {
                        Ok(_permit) => handle_request(req).await,
                        Err(e) => {
                            // Logging the error to stderr or consider using a logging framework
                            eprintln!("Semaphore error: {}", e);
                            Ok(Response::builder()
                                .status(StatusCode::INTERNAL_SERVER_ERROR)
                                .body(Body::from("Server is currently overloaded"))
                                .expect("Failed to build response")) // Safe unwrap because the string literal is always valid
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