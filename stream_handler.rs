use std::collections::HashMap;
use std::env;
use std::sync::{Arc, Mutex};
use std::fmt;

#[derive(Debug, Clone)]
struct Video {
    id: String,
    bitrates: Vec<u32>,
}

#[derive(Debug, Clone)]
struct User {
    id: String,
    current_bitrate: u32,
}

struct VideoRepository {
    videos: HashMap<String, Video>,
}

impl VideoRepository {
    fn new() -> Self {
        Self {
            videos: HashMap::new(),
        }
    }

    fn add_video(&mut self, video: Video) {
        self.videos.insert(video.id.clone(), video);
    }

    fn find_video_by_id(&self, id: &str) -> Option<&Video> {
        self.videos.get(id)
    }
}

struct StreamingService {
    user_sessions: Arc<Mutex<HashMap<String, User>>>,
    videos: VideoRepository,
}

impl StreamingService {
    fn new(videos: VideoRepository) -> Self {
        Self {
            user_sessions: Arc::new(Mutex::new(HashMap::new())),
            videos,
        }
    }

    fn register_user(&self, user: User) -> Result<(), StreamingError> {
        let mut users = self.user_sessions.lock().map_err(|_| StreamingError::LockPoisoned)?;
        users.insert(user.id.clone(), user);
        Ok(())
    }

    fn set_user_bitrate(&self, user_id: &str, bitrate: u32) -> Result<(), StreamingError> {
        let mut users = self.user_sessions.lock().map_err(|_| StreamingError::LockPoisoned)?;
        if let Some(user) = users.get_mut(user_id) {
            user.current_bitrate = bitrate;
            Ok(())
        } else {
            Err(StreamingError::UserNotFound)
        }
    }

    fn initiate_streaming(&self, user_id: &str, video_id: &str) -> Result<(), StreamingError> {
        let user_session = self.user_sessions.lock().map_err(|_| StreamingError::LockPoisoned)?.get(user_id)
                          .ok_or(StreamingError::UserNotFound)?.clone();
        let video = self.videos.find_video_by_id(video_id).ok_or(StreamingError::VideoNotFound)?;

        println!("Streaming video {} to user {} at bitrate {}", video_id, user_id, user_session.current_bitrate);

        Ok(())
    }
}

enum StreamingError {
    LockPoisoned,
    UserNotFound,
    VideoNotFound,
}

impl fmt::Display for StreamingError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match *self {
            StreamingError::LockPoisoned => write!(f, "Mutex lock has been poisoned"),
            StreamingError::UserNotFound => write!(f, "User not found"),
            StreamingError::VideoNotFound => write!(f, "Video not found"),
        }
    }
}

impl std::error::Error for StreamingError {}

fn main() {
    dotenv::dotenv().ok();

    let video_repo = VideoRepository::new();

    let streaming_service = StreamingService::new(video_repo);

    match env::var("API_KEY") {
        Ok(api_key) => println!("API Key: {}", api_key),
        Err(_) => eprintln!("API_KEY must be set"),
    }
}