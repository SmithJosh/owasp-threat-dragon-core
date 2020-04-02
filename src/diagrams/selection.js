'use strict';

var joint = require('jointjs');

function selection() {
    var padding = 10;
    var container = null;

    // Define the functions and properties to reveal.
    var service = {
        newContainer: newContainer,
        getCells: getCells,
        first: first,
        set: set,
        add: add,
        remove: remove,
        clear: clear
    };
    return service;

    function newContainer() {
        container = new joint.shapes.basic.Rect({
            position: { x: 10, y: 10 },
            size: { width: 100, height: 100 },
            attrs: { rect: { fill: '#E74C3C' }, text: { text: 'Parent' }}
        });
        return container;
    }

    function getCells() {
        var embeddedCells = container.getEmbeddedCells();
        return (embeddedCells) ? embeddedCells : []; 
    }

    function first() {
        var embeddedCells = container.getEmbeddedCells();
        if (embeddedCells && embeddedCells.length > 0) {
            return embeddedCells[0];
        } else {
            return null;
        }
    }

    function set(cell) {
        container.clear();
        container.embed(cell);
    }

    function add(cell) {
        if (!contains(cell)) {
            container.embed(cell)
        }

        container.fitEmbeds({ 
            opt: { padding: padding }
        });
    }

    function remove(cell) {
        container.unembed(cell);

        container.fitEmbeds({
            opt: { padding: padding }
        });
    }

    function clear() {
        container.getEmbeddedCells().forEach(embeddedCell => {
            container.unembed(embeddedCell);
            // cell.setUnselected();
        });
    }

    // private

    function contains(cell) {
        return cell.get('parent') === container.id;
    }

}

module.exports = selection;