## Usage

Start server with `npm start` to host at port 8050

Start server with `PORT=<specify_port_here> npm start` to host at a specified port.

### Building node app
As this project uses require() to import modules, webpack is used to build a bundled javascript file.  

Run `npm link webpack` in the 'host' and 'client' directories.
Run `webpack` in the 'host' and 'client' directories. 

Webpack will now watch for changes and rebuild when it detects a diff.

## Docker

### Building Dockerised

`docker build -t cij11/red-black-node-web-app .`

## Running Dockerised

To run attached in docker, run 
`docker run -p 8050:8050 cij11/red-black-node-web-app`

To run attached in docker with this directory mounted as volume (so that changes can be reflected in runnign container), run
`docker run -p 8050:8050 -v $(pwd):/usr/src/app cij11/red-black-node-web-app`

Or, the above command is encoded in the docker-compose.yml, which can be invoked with

`docker-compose up`

