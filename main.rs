use hyper::{service::{make_service_fn, service_fn}, Body, Method, Request, Response, Server, StatusCode};
use std::convert::Infallible;
use std::env;
use std::sync::Arc;
use tokio::sync::Semaphore;

async fn handle_request(req: Request<Body>) -> Result<Response<Body>, Infallible> {
    match (req.method(), req.uri().path()) {
        (&Method::GET, "/stream") => Ok(Response::new(Body::from("Streaming video..."))),
        _ => Ok(Response::builder()
                .status(StatusCode::NOT_FOUND)
                .body(Body::from("404 Not Found"))
                .unwrap())
    }
}

#[tokio::main]
async fn main() {
    let server_addr = env::var("SERVER_ADDR").unwrap_or("127.0.0.1:3000".to_string());
    let server_addr = server_addr.parse().expect("Failed to parse SERVER_ADDR");

    let concurrency_limit = env::var("CONCURRENCY_LIMIT")
                                .unwrap_or("100".to_string())
                                .parse()
                                .expect("Failed to parse CONCURRENCY_LIMIT");
    let semaphore = Arc::new(Semaphore::new(concurrency_limit));

    let make_svc = make_service_fn(move |_conn| {
        let semaphore = semaphore.clone();
        async move {
            Ok::<_, Infallible>(service_fn(move |req| {
                let permit_future = semaphore.clone().acquire_owned();
                async move {
                    if let Ok(_permit) = permit_future.await {
                        handle_request(req).await
                    } else {
                        Ok(Response::builder()
                            .status(StatusCode::INTERNAL_SERVER_ERROR)
                            .body(Body::from("Server error"))
                            .unwrap())
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