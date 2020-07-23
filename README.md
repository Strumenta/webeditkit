# WebEditKit

![](https://img.shields.io/npm/v/webeditkit?style=plastic) 

This is a framework for creating projectional editors which interact with JetBrains MPS.

So you will need to use MPS together with the [MPSServer plugin](https://github.com/Strumenta/MPSServer).

An example is available [here](https://github.com/Strumenta/calc-webeditkit-example).
It contains also some basic instructions on how to use MPSServer and WebEditKit.

## Structure of the project

* **css**: it contains an example of CSS file to be used in the projects based on WebEditKit
* **src**: the source code of this project, in TypeScript

## Development

We suggest using nvm to specify the exact version of node we use.

### Circular dependencies

To avoid them we do what is suggested here: https://medium.com/visual-development/how-to-fix-nasty-circular-dependency-issues-once-and-for-all-in-javascript-typescript-a04c987cf0de

## License

This framework is released under the Apache License V2.0.