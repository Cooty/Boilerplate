# Introduction

This is a very simple boilerplate, for small HTML5-based web-projects. Goal is to provide some basic scaffolding, for local development of static pages. Structure is based on [HTML5 Boilerplate](https://html5boilerplate.com/).

# Usage

First make sure that [Node.js](https://nodejs.org/en/), [Ruby](https://www.ruby-lang.org/en/) and [SASS](http://sass-lang.com/) and [Grunt CLI](http://gruntjs.com/getting-started) are installed on your computer. If so, than run `npm install` in the directory you have the boilerplate in.
After successful installation of all npm modules, run `grunt start`, in your project directory, which will start a watcher for scss files and a static server that runs on `http://localhost:3000` (you can modify this in `server.js`).

# Additional notes

Current version does not have any automated tasks for JS files, they are written manually. The `js/main.js` contains a singleton module pattern scaffold to get you started, and a file structure for third-party plugins and libs (same as in HTML5BP), latest version of jQuery is also included.

# Grunt tasks and NPM modules used

- [node-static]( https://www.npmjs.com/package/node-static) for local server
- [grunt]( http://gruntjs.com/) task runner
- [grunt-execute]( https://www.npmjs.com/package/grunt-execute) for running Node.js scripts from Grunt
- [grunt-contrib-watch]( https://github.com/gruntjs/grunt-contrib-watch)
- [grunt-contrib-sass](https://github.com/gruntjs/grunt-contrib-sass)
- [grunt-concurrent](https://github.com/sindresorhus/grunt-concurrent) for running tasks in parallel



