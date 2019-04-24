## Usage

Start server with `PORT=8081 npm start`

### Building

As this project uses require() to import modules, webpack is used to build a bundled javascript file.  

Run `npm link webpack` in the 'host' and 'client' directories.
Run `webpack` in the 'host' and 'client' directories. 

Webpack will now watch for changes and rebuild when it detects a diff.