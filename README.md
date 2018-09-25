
## abstract-genetic-solver

A simple asynchronous genetic solver that's agnostic about genome types, fitness functions, etc.



----


## Installation


```shell
npm i abstract-genetic-solver
```

## Usage

Here's a trivial solver that treats each genome as an array of 10 floats, and tries to maximize their sum.

```js
var Solver = require('abstract-genetic-solver')
var solver = new Solver(10)

// required methods that client must implement
solver.initGene = (index) => Math.random()
solver.mutateGene = (index, oldValue) => Math.random()
solver.measureFitness = async genome => genome.reduce((prev, val) => prev + val, 0)

// optional per-generation event
solver.afterGeneration = function () {
    var best = solver.getCandidate(0)
    console.log(`Best fitness so far: ${best.fitness}`)
    console.log(`Best genome so far: ${best.genome}`)
}

// start solving
solver.paused = false
```

Note that `measureFitness()` is **async** - this lets you calculate fitness values in a web worker, etc. The method can return a value synchronously of course, but it must be declared as `async`.

## Other settings

```js
// number of individuals in each generation
solver.population = 100

// limit for simultaneous calls to measureFitness (0 => no limit)
solver.maxSimultaneousCalls = 0

// chances of an individual mutating or crossing over each generation
solver.mutationChance = 0.9
solver.crossoverChance = 0.3

// new generations can retain N fittest individuals from the previous
solver.keepFittestCandidates = 3

// How strongly to prefer fitter candidates when evolving
//      1 => choose from all candidates randomly
//      2 => strong bias towards fitter candidates
solver.rankSelectionBias = 1.5
```

## Details

By Andy Hall, MIT license


