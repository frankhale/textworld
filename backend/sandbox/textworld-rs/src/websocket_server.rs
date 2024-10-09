use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tokio::sync::broadcast;
use tokio_tungstenite::accept_async;
use tokio_tungstenite::tungstenite::protocol::Message;

// Define the structure of the incoming message
#[derive(Deserialize)]
struct IncomingMessage {
    path: String,
    data: String,
}

// Define a response message (optional)
#[derive(Serialize)]
struct ResponseMessage {
    message: String,
}

async fn accept_connection(stream: tokio::net::TcpStream) {
    let ws_stream = accept_async(stream)
        .await
        .expect("Error during WebSocket handshake");

    let (mut ws_sender, mut ws_receiver) = ws_stream.split();

    // Handle incoming messages
    while let Some(message) = ws_receiver.next().await {
        match message {
            Ok(Message::Text(text)) => {
                // Parse the incoming message
                match serde_json::from_str::<IncomingMessage>(&text) {
                    Ok(incoming) => {
                        println!(
                            "Received message: path = '{}', data = '{}'",
                            incoming.path, incoming.data
                        );

                        // Prepare a response (optional based on the message's path)
                        let response = ResponseMessage {
                            message: format!(
                                "Processed path: '{}', data: '{}'",
                                incoming.path, incoming.data
                            ),
                        };

                        // Send the response back to the client
                        let response_text = serde_json::to_string(&response).unwrap();
                        if let Err(e) = ws_sender.send(Message::Text(response_text)).await {
                            println!("Error sending response: {}", e);
                        }
                    }
                    Err(e) => {
                        println!("Error parsing incoming message: {}", e);
                    }
                }
            }
            Ok(_) => {}
            Err(e) => {
                println!("Error receiving message: {}", e);
                break;
            }
        }
    }
}

#[tokio::main]
pub async fn run() {
    // Create a TCP listener for WebSocket connections
    let addr = "127.0.0.1:8080".parse::<SocketAddr>().unwrap();
    let listener = TcpListener::bind(&addr)
        .await
        .expect("Can't bind to address");

    println!("WebSocket server running on ws://{}", addr);

    while let Ok((stream, _)) = listener.accept().await {
        tokio::spawn(accept_connection(stream));
    }
}
