use std::env;
use std::sync::Arc;
use std::fmt;
use streaming_service::Stream; // Make sure this trait is defined in your 'streaming_service' module
use mock_streaming_service::MockStream; // Ensure MockStream is implemented in your 'mock_streaming_service' module
use tokio::sync::Mutex;
use dotenv::dotenv;

#[derive(Debug)]
enum TestEnvError {
    EnvVarError(std::env::VarError),
    StreamError(String),
}

impl From<std::env::VarError> for TestEnvError {
    fn from(err: std::env::VarError) -> Self {
        TestEnvError::EnvVarError(err)
    }
}

// Implement std::fmt::Display for TestEnvError for better error messages
impl fmt::Display for TestEnvError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TestEnvError::EnvVarError(e) => write!(f, "Environment variable error: {}", e),
            TestEnvError::StreamError(s) => write!(f, "Stream error: {}", s),
        }
    }
}

struct TestEnvironment {
    pub stream: Arc<Mutex<dyn Stream + Send>>,
}

impl TestEnvironment {
    async fn new() -> Result<Self, TestEnvError> {
        dotenv().ok();

        let stream_service_url = env::var("STREAM_SERVICE_URL")?;
        let stream_service_api_key = env::var("STREAM_SERVICE_API_KEY")?;

        let stream_service = MockStream::new(stream_service_url, stream_service_api_key);

        Ok(TestEnvironment {
            stream: Arc::new(Mutex::new(stream_service)),
        })
    }

    async fn reset_stream(&self) -> Result<(), TestEnvError> {
        self.stream.lock().await.reset().await.map_err(|e| TestEnvError::StreamError(e))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio_test::block_on;

    #[tokio::test]
    async fn test_high_volume_streaming() {
        let test_env = TestEnvironment::new().await.expect("Failed to create test environment");

        let result = test_env.stream.lock().await.simulate_high_volume().await;

        assert!(result.is_ok(), "The stream should handle high volumes of data seamlessly");
    }

    #[tokio::test]
    async fn test_user_interaction_handling() {
        let test_env = TestEnvironment::new().await.expect("Failed to create test environment");

        let play_result = test_env.stream.lock().await.play().await;
        assert!(play_result.is_ok(), "The play action should succeed");

        let pause_result = test_env.stream.lock().await.pause().await;
        assert!(pause_result.is_ok(), "The pause action should succeed");
    }

    #[tokio::test]
    async fn test_stream_reset() {
        let test_env = TestEnvironment::new().await.expect("Failed to create test environment");

        let reset_result = test_env.reset_stream().await;
        assert!(reset_result.is_ok(), "The stream should be able to reset successfully");
    }
}