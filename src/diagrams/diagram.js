﻿'use strict';

var _ = require('lodash');

function diagram($scope, $location, $routeParams, $timeout, dialogs, common, datacontext, threatengine, diagramming, threatmodellocator, selection) {

    // Using 'Controller As' syntax, so we assign this to the vm variable (for viewmodel).
    /*jshint validthis: true */
    var vm = this;
    var controllerId = 'diagram';
    var getLogFn = common.logger.getLogFn;
    var log = getLogFn(controllerId);
    var logError = getLogFn(controllerId, 'error');
    var scope = $scope;
    var threatWatchers = [];
    var gridSizeOn = 10;
    var gridSizeOff = 1;

    // Bindable properties and functions are placed on vm.
    vm.errored = false;
    vm.title = 'ThreatModelDiagram';
    vm.initialise = initialise,
        /*jshint -W030 */
        vm.dirty = false;
    vm.graph = diagramming.newGraph();
    vm.newProcess = newProcess;
    vm.newStore = newStore;
    vm.newFlow = newFlow;
    vm.newActor = newActor;
    vm.newBoundary = newBoundary;
    vm.cloneElement = cloneElement;
    vm.getThreatModelPath = getThreatModelPath;
    vm.edit = edit;
    vm.generateThreats = generateThreats;
    vm.duplicateElement = duplicateElement;
    vm.setGrid = setGrid;
    vm.showGrid = false;
    vm.selection = selection;
    vm.viewStencil = true;
    vm.viewThreats = false;
    vm.stencils = getStencils();
    vm.zoomIn = zoomIn;
    vm.zoomOut = zoomOut;
    vm.reload = reload;
    vm.save = save;
    //fix, maybe hack (?) for desktop app issue https://github.com/mike-goodwin/owasp-threat-dragon-desktop/issues/43
    //is setting values on parent scope code smell?
    //the reason is that the menu is defined on the shell controller whereas the save needs to be aware of the diagram controller
    if ($scope.$parent.$parent) {
        $scope.$parent.$parent.vm.saveDiagram = vm.save;
    }
    vm.clear = clear;
    vm.currentDiagram = {};
    vm.diagramId = $routeParams.diagramId;
    vm.currentZoomLevel = 0;
    vm.maxZoom = 4;

    //structured exit
    $scope.$on('$locationChangeStart', function (event, current, previous) {
        //suppress structured exit when only search changes
        var absPathCurrent = current.split('?')[0];
        var absPathPrevious = previous.split('?')[0];

        if (vm.dirty && absPathCurrent != absPathPrevious) {
            dialogs.structuredExit(event, function () { }, function () { vm.dirty = false; });
        }
    });

    activate();

    function activate() {
        common.activateController([], controllerId)
            .then(function () { log('Activated Threat Model Diagram View'); });
    }

    function getStencils() {

        var shapes = [
            { shape: { getElement: function () { return new diagramming.Process(); }, label: 'Process' }, action: newProcess },
            { shape: { getElement: function () { return new diagramming.Store(); }, label: 'Store' }, action: newStore },
            { shape: { getElement: function () { return new diagramming.Actor(); }, label: 'Actor' }, action: newActor },
            { shape: { getElement: function () { return new diagramming.Flow(); }, label: 'Data Flow' }, action: newFlow },
            { shape: { getElement: function () { return new diagramming.Boundary(); }, label: 'Trust\nBoundary' }, action: newBoundary }];

        return shapes;
    }

    function save() {
        var diagramData = { diagramJson: { cells: vm.graph.getCells() } };

        if (!_.isUndefined(vm.currentDiagram.options) && !_.isUndefined(vm.currentDiagram.options.height) && !_.isUndefined(vm.currentDiagram.options.width)) {
            var size = { height: vm.currentDiagram.options.height, width: vm.currentDiagram.options.width };
            diagramData.size = size;
        }

        datacontext.saveThreatModelDiagram(vm.diagramId, diagramData)
            .then(onSaveDiagram);
    }

    function onSaveDiagram() {
        vm.dirty = false;
        addDirtyEventHandlers();
    }

    function initialise(newDiagram, forceQuery) {
        vm.currentDiagram = newDiagram;
        var threatModelLocation = threatmodellocator.getModelLocation($routeParams);

        datacontext.load(threatModelLocation, forceQuery).then(function (threatModel) {
            onGetThreatModelDiagram(threatModel.detail.diagrams[vm.diagramId]);
        },
            onError);

        function onGetThreatModelDiagram(data) {

            if (!_.isUndefined(data.diagramJson)) {
                vm.graph.initialise(data.diagramJson);
                vm.graph.getCells().forEach(watchThreats);
            }

            if (!_.isUndefined(data.size)) {
                vm.currentDiagram.resize(data.size);
            }

            vm.graph.on('remove', removeElement);
            addDirtyEventHandlers();
            vm.diagram = data;
            vm.dirty = false;

            vm.loaded = true;
        }
    }

    function reload() {
        //only ask for confirmation if diagram is dirty AND it has some cells
        //avoids the confirmation if you are reloading after an accidental clear of the model
        if (vm.dirty && vm.graph.cellCount() > 0) {
            dialogs.confirm('diagrams/confirmReloadOnDirty.html', function () { vm.initialise(vm.currentDiagram, true); });
        }
        else {
            vm.initialise(vm.currentDiagram, true);
        }
    }

    function clear() {
        vm.graph.clearAll();
        vm.currentDiagram.resize( { height: '590', width: '790' } );
    }

    function zoomIn() {
        if (vm.currentZoomLevel < vm.maxZoom) {
            vm.currentZoomLevel++;
            vm.currentDiagram.zoom(vm.currentZoomLevel);
        }
    }

    function zoomOut() {
        if (vm.currentZoomLevel > -vm.maxZoom) {
            vm.currentZoomLevel--;
            vm.currentDiagram.zoom(vm.currentZoomLevel);
        }
    }

    function setGrid() {
        if (vm.showGrid) {
            vm.currentDiagram.setGridSize(gridSizeOn);
            vm.currentDiagram.drawGrid();
        } else {
            vm.currentDiagram.clearGrid();
            vm.currentDiagram.setGridSize(gridSizeOff);
        }
    }

    function onError(error) {
        vm.errored = true;
        logError(error);
    }

    function edit() {
        vm.dirty = true;
    }

    function getThreatModelPath() {
        return threatmodellocator.getModelPathFromRouteParams($routeParams);
    }

    function generateThreats() {
        if (vm.selection.getElements().length === 1) {
            threatengine.generateForElement(vm.selection.first()).then(onGenerateThreats);
        }
    }

    function duplicateElement() {
        if (vvm.selection.getElements().length === 1) {
            var newElement = vm.cloneElement(vm.selection.first());

            var label = "";
            if (typeof newElement.attributes.labels != "undefined"){
                label = 'Copy of ' + newElement.attributes.labels[0].attrs.text.text;   
            }

            if (newElement.attributes.type == "tm.Flow" || newElement.attributes.type == "tm.Boundary") {    
                newElement.attributes.source = {'x' : 30, 'y' : 20};
                newElement.attributes.target = {'x' : 110, 'y' : 100};
                if (label != ""){
                    newElement.attributes.labels[0].attrs.text.text = label;
                }
                delete newElement.attributes.vertices;
            }
            else {
                var height = newElement.attributes.size.height + 20;
                newElement.attributes.position.y += height;
                newElement.attributes.attrs.text.text = label;
            }

            var diagramData = { diagramJson: { cells: vm.graph.getCells() } };
            vm.graph.initialise(diagramData.diagramJson);
        }
    }

    function onGenerateThreats(threats) {
        var threatTotal = threats.length;
        var threatList = threats;
        var currentThreat;
        suggestThreat();

        function suggestThreat() {
            if (threatList.length > 0) {
                currentThreat = threatList.shift();
                dialogs.confirm('diagrams/ThreatEditPane.html',
                    addThreat,
                    function () {
                        return {
                            heading: 'Add this threat?',
                            threat: currentThreat,
                            editing: false,
                            threatIndex: threatTotal - threatList.length,
                            threatTotal: threatTotal
                        };
                    },
                    ignoreThreat,
                    'fade-right'
                );
            }
        }

        function addThreat(applyToAll) {
            if (selection.getElements().length === 1) {
                var element = selection.first();

                vm.dirty = true;

                if (_.isUndefined(element.threats)) {
                    element.threats = [];
                }
    
                element.threats.push(currentThreat);
    
                if (applyToAll) {
                    threatList.forEach(function (threat) {
    
                        element.threats.push(threat);
                    });
                }
                else {
                    $timeout(suggestThreat, 500);
                }
            }
        }

        function ignoreThreat(applyToAll) {
            if (!applyToAll) {
                $timeout(suggestThreat, 500);
            }
        }
    }

    function removeElement(element, graph, state) {
        vm.dirty = true;
        vm.currentDiagram.setUnselected(element);
        unWatchThreats(element);
        //scope.$apply cause an exception when clearing all elements (digest already in progress)
        if (!state.clear) {
            scope.$apply();
        }
    }

    function newProcess() {
        return watchThreats(vm.graph.addProcess());
    }

    function newStore() {
        return watchThreats(vm.graph.addStore());
    }

    function newActor() {
        return watchThreats(vm.graph.addActor());
    }

    function newFlow(source, target) {

        return watchThreats(vm.graph.addFlow(source, target));
    }

    function newBoundary() {

        return vm.graph.addBoundary();
    }

    function cloneElement(element){
        return watchThreats(vm.graph.duplicateElement(element));
    }

    function addDirtyEventHandlers() {

        vm.graph.on('change add', setDirty);

        function setDirty() {
            vm.dirty = true;
            vm.graph.off('change add', setDirty);
            //throws exception (digest already in progress)
            //but removing causes failure to enable save button in diagram editor when moving an element
            //scope.$apply();

        }
    }

    function watchThreats(element) {

        threatWatchers[element.id] = scope.$watch('{ element: "' + element.id + '", threats: vm.graph.getCell("' + element.id + '").threats}', function (newVal) {

            var element = vm.graph.getCell(newVal.element);

            if (newVal.threats) {

                element.hasOpenThreats = newVal.threats.some(function (threat) { return threat.status === 'Open'; });
            }
            else {
                element.hasOpenThreats = false;
            }

        }, true);

        return element;
    }

    function unWatchThreats(element) {

        if (threatWatchers[element.id]) {
            threatWatchers[element.id]();
            threatWatchers.splice(element.id, 1);
        }
    }
}

module.exports = diagram;
