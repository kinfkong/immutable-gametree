class GameTree {
    constructor(rootNode = {}) {
        this.root = {
            id: 0,
            nodes: [rootNode],
            children: []
        }

        this.maxId = 0
        this.currents = {}
        this.parents = {}

        this.idCache = {}
    }

    findTree(id) {
        let cached = this.idCache[id]
        if (cached != null) return cached

        if (this.parents[id] == null) {
            this.idCache[id] = this.root
            return this.root
        }

        let parent = this.findTree(this.parents[id])

        let result = parent.children.find(child => child.id === id)
        this.idCache[id] = result

        return result
    }

    updateTree(id, update) {
        let result = this.clone()

        let updateInner = (id, update) => {
            let parentId = this.parents[id]
            let tree = this.findTree(id)
            let newTree = Object.assign({}, tree, update)

            result.idCache[id] = newTree
            if (tree == null) return null
            if (parentId == null) return newTree

            let parent = this.findTree(parentId)
            let newRoot = updateInner(parentId, {
                children: parent.children.map(
                    child => child.id !== id ? child : newTree
                )
            })

            return newRoot
        }

        result.root = updateInner(id, update)
        return result.root == null ? this : result
    }

    updateNode(id, index, update) {
        let tree = this.findTree(id)
        if (tree == null || index < 0 || index >= tree.nodes.length) return this

        return this.updateTree(id, {
            nodes: tree.nodes.map(
                (node, i) => i !== index ? node : Object.assign({}, node, update)
            )
        })
    }

    pushNodes(id, index, ...nodes) {
        let tree = this.findTree(id)
        if (tree == null || index < 0 || index >= tree.nodes.length) return this

        if (index === tree.nodes.length - 1 && tree.children.length === 0) {
            // Append nodes to existing tree

            return this.updateTree(id, {
                nodes: [...tree.nodes, ...nodes]
            })
        } else if (index === tree.nodes.length - 1) {
            // Append new tree with nodes

            let newTree = {id: ++this.maxId, nodes, children: []}
            let result = this.updateTree(id, {
                children: [...tree.children, newTree]
            })

            result.parents = Object.assign({}, this.parents, {[newTree.id]: id})
            return result
        } else {
            // Insert new tree in the middle of a tree

            let bottom = {
                id: ++this.maxId,
                nodes: tree.nodes.slice(index + 1),
                children: tree.children
            }
            let newTree = {
                id: ++this.maxId,
                nodes,
                children: []
            }
            let top = {
                nodes: tree.nodes.slice(0, index + 1),
                children: [bottom, newTree]
            }

            let result = this.updateTree(id, top)

            result.parents = Object.assign(
                {}, this.parents,
                ...top.children.map(child => ({[child.id]: id})),
                ...bottom.children.map(child => ({[child.id]: bottom.id}))
            )

            return result
        }
    }

    toObject() {
        return this.root
    }

    clone() {
        return Object.assign(new GameTree(), this, {
            idCache: {}
        })
    }
}

GameTree.fromObject = function(obj) {
    let result = new GameTree()

    function traverse(tree) {
        result.maxId = Math.max(result.maxId, tree.id)
        result.idCache[tree.id] = tree

        for (let child of tree.children) {
            traverse(child)
            result.parents[child.id] = tree.id
        }

        return tree
    }

    result.root = traverse(obj)

    return result
}

module.exports = GameTree
