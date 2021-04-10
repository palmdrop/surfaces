# WebGL Domain Warping Controller
This is an exploratory repository for learning WebGL, GLSL, and React. I'm developing an interface for controlling a shader based on recursive domain warping and modified noise. This project is a web- and shader-based extension of my ongoing [sandbox project](https://github.com/palmdrop/sandbox) for creating generative art. 

Below are some screenshots that highlight the current state and capabilities of the project. 

![Example 1](/img/example/screenshot1.png)
![Example 2](/img/example/screenshot2.png)
![Example 3](/img/example/screenshot3.png)

For an explanation of the underlying techniques, I suggest reading my blog post about [domain warping](https://palmdrop.github.io/post/domain-warping/), and possibly also [this post](https://palmdrop.github.io/post/alien-patterns/) which describes how domain warping can be done recursively, in combination with modified noise, to produce complex visual effects.

The project was created using [create-react-app](https://github.com/facebook/create-react-app). 

## Usage
At this stage, the application is not live on the web. However, you can clone the repository and run it using `npm`. You'll find a short installation tutorial in the following section.

You can start the program using `npm start`. The page will then open at `localhost:3000`. 

Once running, you can use the sliders to control the shader. The coloring is arbitrary, and will also be controllable in the future.

## Installation
Make sure you install [node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm). Clone this repository and enter the created folder. Run `npm start` to start the application. 

## Contact and social media
:mailbox_with_mail: [Email](mailto:anton@exlex.se) (the most reliable way of reaching me)

:camera: [Instagram](https://www.instagram.com/palmdrop/) (where I showcase a lot of my work)

:computer: [Blog](https://palmdrop.github.io/) (where I occasionally write posts about my process)
