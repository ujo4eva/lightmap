#include <WiFi.h>
#include <PubSubClient.h>

// === CONFIGURATION - CHANGE THESE ===
const char* ssid     = "Osadebamwen's Redmi Note 13";
const char* password = "khZTuvh8jzP55kHy1AUJ";

const char* mqtt_server   = "broker.emqx.io";     // or broker.hivemq.com
const int   mqtt_port     = 1883;
const char* mqtt_clientId = "esp32-auditorium-001";     // unique per device
const char* topic_status  = "campus/power/esp32-001/status";

// How often to send heartbeat (microseconds)
const uint64_t sleepTime_us = 5 * 60 * 1000000ULL;  // 5 minutes

WiFiClient espClient;
PubSubClient client(espClient);

RTC_DATA_ATTR int bootCount = 0;  // Global, before setup()

// ... (includes and config unchanged)

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\n\n=== ESP32 Power Heartbeat Boot ===");
  Serial.printf("Boot count: %d | Awake since reset\n", ++bootCount);

  // WiFi connect (unchanged – good)
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi...");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected. IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nWiFi failed – check credentials/signal. Sleeping...");
    esp_deep_sleep_start();
  }

  // Setup MQTT
  client.setServer(mqtt_server, mqtt_port);

  pinMode(2, OUTPUT);
  digitalWrite(2, HIGH);  // LED OFF

  // Set Last Will (critical for power-loss detection)
  //const char* lwt_payload = "offline | unexpected power loss";
  //client.setWill(topic_status, lwt_payload, 1, true);  // QoS 1, retained=true

  // Connect with retries
  int retries = 0;
  while (!client.connected() && retries < 5) {
    Serial.print("MQTT connect attempt ");
    Serial.print(retries + 1);
    if (client.connect(mqtt_clientId)) {
      Serial.println(" → success!");
      digitalWrite(2, LOW);  // Blue LED ON = good

      String msg = "online | boot:" + String(bootCount);
      //boolean pubSuccess = client.publish(topic_status, msg.c_str(), true, 1);  // retained=true, QoS 1
      //Serial.println(pubSuccess ? "Published: " + msg : "Publish failed!");
    } else {
      Serial.print(" → failed, rc=");
      Serial.println(client.state());  // -2 = network fail, -4 = timeout, etc.
      delay(2000);
      retries++;
    }
  }
  if (!client.connected()) {
    digitalWrite(2, HIGH);  // OFF = fail
    Serial.println("MQTT connection failed after retries – sleeping anyway");
  }

  client.loop();  // Optional but harmless

  // Clean disconnect + tiny safety delay
  client.disconnect();
  delay(200);  // Give broker time to process disconnect/LWT if needed

  Serial.println("Going to deep sleep for " + String(sleepTime_us / 1000000) + " seconds...");
  Serial.flush();
  delay(100);  // Ensure prints flush

  esp_deep_sleep_start();
}

void loop() {}  // Empty