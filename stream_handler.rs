use std::collections::HashMap;
use std::env;
use std::sync::{Arc, Mutex};

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

    fn add_user(&self, user: User) {
        let mut users = self.users.lock().unwrap();
        users.insert(user.id.clone(), user);
    }

    fn update_user_bitrate(&self, user_id: &str, bitrate: u32) {
        let mut users = self.users.lock().unwrap();
        if let Some(user) = users.get_mut(user_id) {
            user.current_bitrate = bitrate;
        }
    }

    fn stream_to_user(&self, user_id: &str, video_id: &str) {
        if let Some(user) = self.users.lock().unwrap().get(user_id) {
            if let Some(video) = self.storage.get_video(&video_id) {
                println!("Streaming video {} to user {} at bitrate {}", video_id, user_id, user.current_bitrate);
            }
        }
    }
}

fn main() {
    dotenv::dotenv().ok();

    let storage = VideoStorage::new();

    let manager = StreamManager::new(storage);

    let api_key = env::var("API_KEY").expect("API_KEY must be set");

    println!("API Key: {}", api_key);
}