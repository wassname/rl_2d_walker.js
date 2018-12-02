# boxidroid

TODO: Write a project description

## Installation

TODO: Describe the installation process

## Usage

TODO: Write usage instructions

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## TODO

- [x] make walker into an env, with reset, done etc
- [x] display save loss curves... everything from info
- [x] make diff env's, copy humanoidwalker, humanoid, learning2run etc
- [ ] display
    - [x] display/save time for each agent
        - [x] globals.step_counter
    - [x] x progress
    - [ ] smile frown?
    - [ ] fix my frameskip
    - [x] save checkpoints
- [ ] obstacles later on
    - [x] balls
    - [ ] Allow user to chuck bouncing balls. Some can remain as obstacles
- [x] load pretrained
- [x] reward hacking
    - [x] head high, feet on ground, legs crossing, moving forward, angles near 0

# Credits

- The walker code is adapted from <a href="http://rednuht.org/genetic_walkers/">http://rednuht.org/genetic_walkers/</a>
- DDPG code from metacar

# Notes

- Training times:
    - Without node: Training: 52732.152ms
    - With node:    Training: 17211.739ms
    - With cuda     LoopTime: 12583.449ms
- tfjs-node-gpu needs python2 to compile

- is is slipping, what about with more friction?
