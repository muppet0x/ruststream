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

struct VideoStorage {
    videos: HashMap<String, Video>,
}

impl VideoStorage {
    fn new() -> Self {
        Self {
            videos: HashMap::new(),
        }
    }

    fn add_video(&mut self, video: Video) {
        self.videos.insert(video.id.clone(), video);
    }

    fn get_video(&self, id: &str) -> Option<&Video> {
        self.videos.get(id)
    }
}

struct StreamManager {
    users: Arc<Mutex<HashMap<String, User>>>,
    storage: VideoStorage,
}

impl StreamManager {
    fn new(storage: VideoStorage) -> Self {
        Self {
            users: Arc::new(Mutex::new(HashMap::new())),
            storage,
        }
    }

    fn add_user(&self, user: User) -> Result<(), StreamManagerError> {
        let mut users = self.users.lock().map_err(|_| StreamManagerError::LockPoisoned)?;
        users.insert(user.id.clone(), user);
        Ok(())
    }

    fn update_user_bitbite(&self, user_id: &str, bitrate: u32) -> Result<(), StreamManagerError> {
        let mut users = self.users.lock().map_err(|_| StreamManagerError::LockPoisoned)?;
        if let Some(user) = users.get_mut(user_id) {
            user.current_bitrate = bitrate;
            Ok(())
        } else {
            Err(StreamManagerError::UserNotFound)
        }
    }

    fn stream_to_user(&self, user_id: &str, video_id: &str) -> Result<(), StreamManagerError> {
        let user = self.users.lock().map_err(|_| StreamManagerError::LockPoisoned)?.get(user_id)
                          .ok_or(StreamManagerError::UserNotFound)?.clone();
        let video = self.storage.get_video(video_id).ok_or(StreamManagerError::VideoNotFound)?;

        println!("Streaming video {} to user {} at bitrate {}", video_id, user_id, user.current_bitrate);

        Ok(())
    }
}

enum StreamManagerError {
    LockPoisoned,
    UserNotFound,
    VideoNotFound,
}

impl fmt::Display for StreamManagerError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match *self {
            StreamManagerError::LockPoisoned => write!(f, "Mutex lock has been poisoned"),
            StreamManagerError::UserNotFound => write!(f, "User not found"),
            StreamManagerError::VideoNotFound => write!(f, "Video not found"),
        }
    }
}

impl std::error::Error for StreamManagerError {}

fn main() {
    dotenv::dotenv().ok();

    let storage = VideoStorage::new();

    let manager = StreamManager::new(storage);

    match env::var("API_KEY") {
        Ok(api_key) => println!("API Key: {}", api_key),
        Err(_) => eprintln!("API_KEY must be set"),
    }
}