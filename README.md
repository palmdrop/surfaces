# _SURFACES_ - A Recursive Domain Warping Controller
_**LIVE AT [palmdrop.github.io/surfaces/](https://palmdrop.github.io/surfaces/)**_

*Surfaces* is a web application for controlling a shader that implements recursive domain warping using simplex noise. WebGL and GLSL are used to implement the shader itself, while React is used for the user interface. The idea behind *Surfaces* is to make some of the techniques developed in my ongoing [sandbox project](https://github.com/palmdrop/sandbox) accessible and easy to explore. The application runs in real-time and should work in most modern browsers. However, to ensure good quality, a browser with support for WebGL2 is required.

There also exists a 3D mode, powered by [three.js](https://github.com/mrdoob/three.js/). This mode has some separate settings, but is just a 3D mesh which uses variations of the WebGl domain warp as a texture, normal map and displacement map. 

Below are some screenshots of the user interface and some possible shader configurations. 

![Example 1](/img/example/interface1.png)
![Example 2](/img/example/interface2.png)
![Example 4](/img/example/interface4.png)

For an explanation of the underlying techniques, I suggest reading my blog post about [domain warping](https://palmdrop.github.io/post/domain-warping/), and possibly also [this post](https://palmdrop.github.io/post/alien-patterns/) which describes how domain warping can be done recursively, and when combined with modified noise, produce extremely complex visual effects.

The project was created using [create-react-app](https://github.com/facebook/create-react-app). A GLSL loader ([glslify](https://github.com/glslify/glslify-loader)) is used to simplify shader source management. To use this loader, webpack had to be configured slightly. Instead of ejecting, [rescripts](https://github.com/harrysolovay/rescripts) was used, with [this](https://gist.github.com/Bjvanminnen/595d9fef3b1320d1f94632f8c2d323ef#gistcomment-3085086) `.rescriptrc` file. 

Under `img/example` you'll find a few example images generated using this application. Feel free to use the app as you like, and post your creations wherever you wish. However, please leave a link to this repository if you do.

## Usage
Go to [palmdrop.github.io/surfaces/](palmdrop.github.io/surfaces/) or clone this repository and run it using `npm`. You'll find a short installation tutorial in the following section.

You can start the program using `npm start`. The page will then open at `localhost:3000`. 

Once running, you can use the sliders to control the shader. 

## Installation
Make sure you install [node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm). Clone this repository and enter the created folder. Run `npm install` to install the necessary dependencies, then run `npm start` to start the application. 

## Contact and social media
:mailbox_with_mail: [Email](mailto:anton@exlex.se) (the most reliable way of reaching me)

:camera: [Instagram](https://www.instagram.com/palmdrop/) (where I showcase a lot of my work)

:computer: [Blog](https://palmdrop.github.io/) (where I occasionally write posts about my process)
