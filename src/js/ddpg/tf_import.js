const tf = require('@tensorflow/tfjs')
if (typeof WEB === "undefined") {
    // Load the binding (note you may have to press enter in the terminal for some reason)
    require('@tensorflow/tfjs-node-gpu');
    require('@tensorflow/tfjs-node'); // seem to need this as well for save?
}
module.exports = {
    tf
}
