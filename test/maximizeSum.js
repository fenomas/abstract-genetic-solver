'use strict'

var Solver = require('..')


// trivial test problem:
// a genome is 20 floats, just maximize their sum


var solver = new Solver(20)


// settings
solver.population = 200
solver.maxSimultaneousCalls = 50

solver.mutationChance = 0.8
solver.crossoverChance = 0.4
solver.keepFittestCandidates = 3
solver.rankSelectionBias = 1.5


// methods
solver.initGene = function (index) {
    return Math.random()
}

solver.mutateGene = function (index, oldValue) {
    return Math.random()
}

solver.measureFitness = async function (genome) {
    return genome.reduce((prev, val) => prev + val, 0)
}

solver.afterGeneration = function () {
    var best = solver.getCandidate(0)
    console.log(`Generation ${solver.generation}, best fitness: ${best.fitness}`)
    if (solver.generation >= 20) {
        console.log(`Pausing...`)
        solver.paused = true
        if (process) process.exit()
    }
}


// go!
solver.paused = false

