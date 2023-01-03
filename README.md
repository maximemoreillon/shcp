# Smart Home Control Panel

This is a Node.js web app that allows users to control and monitor IoT devices.

Project page: https://articles.maximemoreillon.com/articles/154

Currently, is designed to control the following type of MQTT enabled devices:

- Lights
- Heaters
- Air conditioners
- Sensors

## Disclaimers

- The app was mainly built so as to learn about Node.js and is not intended to compete with existing software sharing the same purpose such as home assistant.
- Because I built this app while learning about Node.js, a lot of its code is poorly written. Please excuse my lack of time to improve it.

## Data persistence

When this service is run as a docker container, floorplans can be persisted by creating a volume for the /usr/src/appfloorplan directory
