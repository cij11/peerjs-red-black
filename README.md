## Usage

Start server with `PORT=8081 npm start`

### Building

As this project uses require() to import modules, webpack is used to build a bundled javascript file.  

Run `webpack index.js -o bundle.js` in the 'host' and 'client' directories.