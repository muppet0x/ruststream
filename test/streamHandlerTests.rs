use std::env;
use std::sync::Arc;
use streaming_service::Stream;
use mock_streaming_service::MockStream;
use tokio::sync::Mutex;
use tokio_test::block_on;
use dotenv::dotenv;

struct TestEnvironment {
    pub stream: Arc<Mutex<dyn Stream + Send>>,
}

impl TestEnvironment {
    async fn new() -> Self {
        dotenv().ok(); 

        let stream_service = MockStream::new(
            env::var("STREAM_SERVICE_URL").expect("STREAM_SERVICE_URL must be set"),
            env::var("STREAM_SERVICE_API_KEY").expect("STREAM_SERVICE_API_KEY must be set"),
        );

        TestEnvironment {
            stream: Arc::new(Mutex::new(stream_service)),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_high_volume_streaming() {
        let test_env = TestEnvironment::new().await;

        let result = test_env.stream.lock().await.simulate_high_volume().await;

        assert!(result.is_ok(), "The stream should handle high volumes of data seamlessly");
    }

    #[tokio::test]
    async fn test_user_interaction_handling() {
        let test_env = TestEnvironment::new().await;

        let play_result = test_env.stream.lock().await.play().await;
        assert!(play_result.is_ok(), "The play action should succeed");

        let pause_result = test_env.stream.lock().await.pause().await;
        assert!(pause_result.is_ok(), "The pause action should succeed");
    }
}