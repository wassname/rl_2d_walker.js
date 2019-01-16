import * as tf from '@tensorflow/tfjs';
if (typeof WEB === "undefined") {
    // Load the binding (note you may have to press enter in the terminal for some reason)
    // import tfjsNodeGpu from '@tensorflow/tfjs-node-gpu';
    // import tfjsNode from '@tensorflow/tfjs-node'; // seem to need this as well for save?
    require('@tensorflow/tfjs-node-gpu');
    require('@tensorflow/tfjs-node'); // seem to need this as well for save?
}
export {
    tf
}
