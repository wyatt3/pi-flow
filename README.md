# Pi Flow - A DIY Wifi-Controlled Sprinkler Timer

Pi Flow is a simple, low-cost, wifi-enabled sprinkler controller.

It allows for manual and automatic, schedule-based valve control, with the goal of adding weather monitoring and seasonal schedules in the future.

Depending on what related hardware you already have (sprinkler valves, valve power supply, wire to connect from valves to controller), this project can be had for around $25 or less.

## Software

- Node.js and Express (back-end)
- Vue 3 and Vite (front-end)

## Hardware

* A minimum of a Raspberry Pi Zero W (with a few small caveats during setup). [AdaFruit](https://www.adafruit.com/product/3400) has them for a pretty reasonable price ($15 as of November 2025).
    * A Micro SD Card (8 GB is plenty).
    * Micro USB Cable and 5V Power Adapter.
* Any Relay Board(s) (one with optocoupling if you're using a 3.3v based Pi), the number of relays you want is only limited by the number of GPIO pins on your main board. You can find these on [AliExpress](https://aliexpress.com) or [DigiKey](https://digikey.com) for a few dollars.
* Jumper Wires (to connect the Pi and Relay Board). Again, you can find these on [AliExpress](https://aliexpress.com) or [DigiKey](https://digikey.com) for a few dollars.

# Installation and Setup

You may notice this repo contains a `docker-compose.yml` file. Currently, docker is only used for the development side of this project, and not the production side, due to certain limitations of the Raspberry Pi Zero W.
So for now, Pi Flow is designed to be deployed without containerization. If you want to set up the development side of the project, keep following the instructions here for now, and we'll break off when the setup process diverges.

## Getting Started

I won't cover how to flash an OS to a Raspberry Pi, or how to install Node.js and npm, because there's plenty of guides on how to do that already, but to run Pi Flow, you'll need some OS that you're comfortable with (I'm using the latest version of [Raspberry Pi OS Lite](https://www.raspberrypi.com/software/operating-systems/)) configured to have internet access, and have `git`, `node`, and `npm` installed.  

If you're setting up for development, you'll only need `git` and `docker` installed.

If you're using a Raspberry Pi Zero W, it's a good idea to also configure SSH access and do the rest of the setup remotely from another computer (I'll talk about why this is important later).

## Clone the Repo

```
git clone https://github.com/wyatt3/pi-flow.git pi-flow
cd pi-flow
```

## Copy the .env.example file

```
cp .env.example .env
```

Your new .env file will contain the following:

```
PORT=80
VITE_WS_PORT=80
GPIO_ENABLED=false
TIMEZONE=America/New_York
```

* Change the value of `TIMEZONE` to your current timezone. You can find the name of your current timezone [here](https://momentjs.com/timezone/).
* `PORT` and `VITE_WS_PORT` should always be the same value, but don't necessarily have to stay `80`. They can be changed to any valid port number, although you will need to rebuild the front-end every time you change `VITE_WS_PORT`.

**If you're setting up for development, skip to the [Development Setup](#development-setup) section now.**

* Change the value of `GPIO_ENABLED` to `true`.

## Copy the pinToLineMap.example.json file

I'm a little unhappy with this portion of the project, but I have yet to find an acceptable alternative package. The package that Pi Flow uses for GPIO control, `onoff`, is built to work with `libgpiod V1`. Debian Trixie uses `libgpiod V2`, so the pin numbers `onoff` needs to interact with the correct pins are not the physical pin number OR the GPIO pin number. If you're using a Raspberry Pi Zero W (and I haven't tested, but likely all other Raspberry Pis) the map in the `pinToLineMap.example.json` file should work fine for you. We can verify later. If you're using Debian Bookworm or earlier, this file can be edited to be a simple passthrough.

Regardless of what OS you're using, we need to copy the example file to our production-use file.

```
cp ./src/config/pinToLineMap.example.json ./src/config/pinToLineMap.json
```

Your `pinToLineMap.json` file should now look like this:

```
{
    "2": 514,
    "3": 515,
    "4": 516,
    "5": 517,
    "6": 518,
    "7": 519,
    "8": 520,
    "9": 521,
    "10": 522,
    "11": 523,
    "12": 524,
    "13": 525,
    "14": 526,
    "15": 527,
    "16": 528,
    "17": 529,
    "18": 530,
    "19": 531,
    "20": 532,
    "21": 533,
    "22": 534,
    "23": 535,
    "24": 536,
    "25": 537,
    "26": 538,
    "27": 539
}
```

The keys in the JSON object are the GPIO pin numbers, and the values are the numbers we need to pass into the `onoff` package's functions. So, if you're using Debian Bookworm or earlier, you can edit this file to look like:

```
{
    "2": 2,
    "3": 3,
    "4": 4,
    ...
}
```

If you're on Debian Trixie or later and want to verify the example map is correct, you can find these values in your system kernel files.

```
cat /sys/kernel/debug/gpio
```

In the future, I hope to replace the `onoff` package with a package built for `libgpiod V2`, but for now, this map allows you to use the GPIO pin number when adding a `Zone` from the web interface.

## Install NPM Dependencies

If you are using a Raspberry Pi Zero W, skip to the [Raspberry Pi Zero W Specific Installation Instructions](#raspberry-pi-zero-w-specific-installation-instructions) section

```
npm install
```

## Build the Front-End

```
npm run build
```

## Start the Back-End

```
npm start
```
Your Pi Flow app should now be available in your browser at `http://{pi-ip-address}`

# Getting Pi Flow to start on boot

If you want Pi Flow to start automatically every time your Pi boots up, you can create a service file and use `systemd` to achieve this.

Create a `piflow.service` file:

```
sudo nano /etc/systemd/system/piflow.service
```

Put the following into the service file and change the value of `WorkingDirectory` to the root directory of your Pi Flow installation:

```
[Unit]
Description=Pi Flow Service
After=network.target

[Service]
ExecStart=/usr/bin/npm start
WorkingDirectory=/path/to/pi-flow
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Reload systemd so it finds your service:

```
sudo systemctl daemon-reload
```

Enable the new service so it starts on every boot:

```
sudo systemctl enable piflow.service
```

Finally, start the service:

```
sudo systemctl start piflow.service
```

You can check the status of your new service with:

```
sudo systemctl status piflow.service
```

You should see somewhere in the output: `enabled`, and `active (running)`. If not something went wrong with either your service configuration or your Pi Flow installation.

# Raspberry Pi Zero W Specific Installation Instructions

## Install NPM Dependencies

```
cd pi-flow
npm install --omit=dev
```

The `--omit=dev` flag is necessary here when installing on a Raspberry Pi Zero W, because of the dated ARMv6 architecture of the SOC. The Rapsberry Pi Zero W cannot run vite, which we use for the front end asset bundling, but we have a pretty easy work-around! We can build the front-end on a more capable machine, and then copy the files over to our Pi. This is why I suggested configuring SSH earlier.

To do this, on your more capable machine, follow all the steps from [getting started](#getting-started) all the way down to [building the front-end](#build-the-front-end).

Then, copy the resulting `public` directory in the project to your Pi with `scp`:

```
scp /path/to/pi-flow/public {pi-user}@{pi-ip-address}:/path/to/pi-flow/
```
Now that you have a compiled front-end on your Pi, you can continue the normal setup instructions at [Start the Back-End](#start-the-back-end) from your Pi.

# Development Setup

## Starting the Container

In the project's root directory, run:
```
docker compose up -d --build
```
Once the container builds and starts, the app should be available at `http://localhost:5173`. 

## Making Changes
Before making any changes, please review the [Contribution Guidelines](CONTRIBUTING.md).
The processes running inside the container will watch for any changes to the source files and update in real time.

You can monitor these processes by running: 
```
docker logs -f pi-flow
```
To import new packages or run any other `npm` related commands, we must first enter the container by running:
```
docker compose exec -it app bash
```
Once inside the container you can use `npm` as you normally would.
