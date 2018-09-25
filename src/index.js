'use strict'

module.exports = AbstractSolver


/*
 *      Abstract genetic solver
 * 
 *      all genomes are arrays of floats
 *      fitness function is assumed to be async
 * 
*/


function AbstractSolver(genomeSize) {
    var self = this

    var numGenes = genomeSize | 0
    if (!(numGenes > 0)) throw 'Bad genome size: ' + genomeSize


    /*
     * 
     *      mutable parameters
     * 
    */

    this.paused = true

    this.population = 100
    this.maxSimultaneousCalls = 0

    this.mutationChance = 0.9
    this.crossoverChance = 0.3
    this.keepFittestCandidates = 3
    this.rankSelectionBias = 1.5



    /*
     * 
     *      Methods for client to implement
     * 
    */

    this.initGene = function (index) {
        throw 'Client must override #initGene!'
        // return Math.random()
    }

    this.mutateGene = function (index, oldValue) {
        throw 'Client must override #mutateGene!'
        // return Math.random()
    }

    this.measureFitness = async function (genome) {
        throw 'Client must override #measureFitness!'
        // return genome.reduce((prev, val) => prev + val, 0)
    }

    this.afterGeneration = function () {
        // Client can optionally implement this
    }



    /*
     * 
     *          API
     * 
    */

    this.generation = 0

    this.getCandidate = function (rank) {
        if (rank >= currGen.length) return null
        return {
            fitness: currGen[rank].fitness,
            genome: currGen[rank].genome.slice(),
        }
    }

    this.getProgress = function () {
        return [
            self.generation,
            countEntities(0),
            countEntities(1),
            countEntities(2),
        ]
    }





    /*
     * 
     *          internal state
     * 
    */

    var currGen = []    // already evaluated, retained for querying 
    var nextGen = []    // entities currently being evaluated

    function Entity(genome, fitness, state) {
        this.genome = genome
        this.fitness = fitness || 0
        this.state = state || 0
    }




    /*
     * 
     *          genome manipulating functions
     * 
    */

    function clone(arr) {
        return arr.slice()
    }

    function mutate(arr) {
        var i = Math.floor(Math.random() * arr.length)
        arr[i] = self.mutateGene(i, arr[i])
    }

    function crossover(a, b) {
        var ix = 1 + Math.floor(Math.random() * (a.length - 2))
        return a.map((n, i) => (i < ix) ? n : b[i])
    }




    /*
     * 
     *          core implementation
     * 
    */


    // top level function that drives everything

    setInterval(function pingSolver() {
        if (self.paused) return
        if (nextGen.length === 0) initPopulation()
        processPopulation()
        if (readyToEvolve()) evolveNewGeneration()
    }, 10)





    function initPopulation() {
        // called once at init time
        // fill population with entities with initialized genomes
        while (nextGen.length < self.population) {
            var genome = Array.from(Array(numGenes)).map(($, i) => {
                return self.initGene(i)
            })
            nextGen.push(new Entity(genome))
        }
        currGen = nextGen
        self.generation = 1
    }


    function countEntities(state) {
        return nextGen.reduce((prev, ent) => {
            return prev + ((ent.state === state) ? 1 : 0)
        }, 0)
    }


    function processPopulation() {
        // called every tick
        // look for entities who need evaluating
        //      entity.state: 0=new, 1=pending, 2=evaluated
        var pending = countEntities(1)
        var maxCalls = self.maxSimultaneousCalls || self.population
        if (pending >= maxCalls) return
        // start new fitness calls
        nextGen.forEach(ent => {
            if (pending >= maxCalls) return
            if (ent.state !== 0) return
            ent.state = 1
            pending++
            self.measureFitness(ent.genome).then(result => {
                ent.fitness = result
                ent.state = 2
            })
        })
    }



    function readyToEvolve() {
        // called every tick
        var ready = nextGen.reduce((prev, ent) => {
            return prev + ((ent.state === 2) ? 1 : 0)
        }, 0)
        return (ready === nextGen.length)
    }



    function evolveNewGeneration() {
        // start a new generation - mutate, crossover, etc.
        // first sort fittest candidates to be first
        nextGen.sort((a, b) => b.fitness - a.fitness)
        // create new generation out of previous one
        currGen = nextGen
        nextGen = []
        while (nextGen.length < self.keepFittestCandidates) {
            var keep = currGen[nextGen.length]
            nextGen.push(new Entity(keep.genome, keep.fitness, keep.state))
        }
        while (nextGen.length < self.population) {
            nextGen.push(makeNewEntity(currGen))
        }
        // complete
        self.generation++
        self.afterGeneration()
    }




    function makeNewEntity(source) {
        var size = source.length
        var bias = self.rankSelectionBias
        var doCross = (Math.random() < self.crossoverChance)
        var doMut = (Math.random() < self.mutationChance)
        var a = source[selectRank(size, bias)]
        var genome = (doCross) ?
            crossover(a.genome, source[selectRank(size, bias)].genome) :
            clone(a.genome)
        if (doMut) mutate(genome)
        var ent = new Entity(genome)
        if (!(doCross || doMut)) {
            ent.fitness = a.fitness
            ent.state = a.state
        }
        return ent
    }



}




// select random index, biased towards early ranks
// algo: https://cs.stackexchange.com/questions/89886/how-is-rank-selection-better-than-random-selection-and-rws
function selectRank(size, bias) {
    bias = bias || 1.5
    if (bias <= 1) return Math.floor(size * Math.random())
    var rand = (bias - Math.sqrt(bias * bias - 4 * (bias - 1) * Math.random())) / 2 / (bias - 1)
    return Math.floor(size * rand)
}




