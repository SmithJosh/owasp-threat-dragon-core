'use strict';

var $ = require('jquery');
var joint = require('jointjs');

describe('stencil directive: ', function () {

    var $rootScope;
    var $scope;
    var $compile;
    var $httpBackend;
    var diagramming;
    var elem;

    beforeEach(function () {

        angular.mock.module('owasp-threat-dragon-core');

        angular.mock.inject(function (_$rootScope_, _$compile_, _$httpBackend_, _diagramming_) {
            $rootScope = _$rootScope_;
            $scope = $rootScope.$new();
            $compile = _$compile_;
            diagramming = _diagramming_;
            $httpBackend = _$httpBackend_;
            $httpBackend.expectGET().respond();
        });

        $rootScope.$apply();

        $scope.action = function () { };
        spyOn($scope, 'action');

    });

    describe('element stencil tests: ', function () {

        beforeEach(function () {

            $scope.shape = { getElement: function () { return new diagramming.Process(); }, label: 'Process' };

        });

        it('should set default padding', function () {

            setFixtures('<tmt-stencil action="action()" shape="shape" />');
            elem = angular.element($('tmt-stencil')[0]);
            $compile(elem)($scope);
            $scope.$digest();

            expect(elem.isolateScope().padding).toEqual(0.0);

        });

        it('should set default scale', function () {

            setFixtures('<tmt-stencil action="action()" shape="shape" />');
            elem = angular.element($('tmt-stencil')[0]);
            $compile(elem)($scope);
            $scope.$digest();

            expect(elem.isolateScope().scale).toEqual(1.0);

        });

        it('should use the supplied scale and padding', function () {

            setFixtures('<tmt-stencil action="action()" scale="2.0"padding="10.0" shape="shape" />');
            elem = angular.element($('tmt-stencil')[0]);
            $compile(elem)($scope);
            $scope.$digest();

            expect(elem.isolateScope().scale).toEqual(2.0);
            expect(elem.isolateScope().padding).toEqual(10.0);

        });

        it('should contain the specified element', function () {

            setFixtures('<tmt-stencil action="action()" scale="2.0"padding="10.0" shape="shape" />');
            elem = angular.element($('tmt-stencil')[0]);
            $compile(elem)($scope);
            $scope.$digest();

            if (navigator.userAgent.indexOf('PhantomJS') < 0) {
                expect($(elem).find("[data-type='tm.Process']").length).toEqual(1);
            } else {
                //weaker test for PhantomJS since it does something funny with SVG classes
                expect($(elem).find('[model-id]').length).toEqual(1);
            }
            var label = $(elem).find('text').find('tspan');
            expect(label[0]).toContainText($scope.shape.label);

        });
    });

    describe('link stencil tests: ', function () {

        beforeEach(function () {

            $scope.shape = $scope.shape = { getElement: function () { return new diagramming.Flow(); }, label: 'Flow' };

        });

        it('should contain the specified link', function () {

            setFixtures('<tmt-stencil action="action()" scale="2.0"padding="10.0" shape="shape" />');
            elem = angular.element($('tmt-stencil')[0]);
            $compile(elem)($scope);
            $scope.$digest();

            if (navigator.userAgent.indexOf('PhantomJS') < 0) {
                expect($(elem).find("[data-type='tm.Flow']").length).toEqual(1);
            } else {
                //weaker test for PhantomJS since it does something funny with SVG classes
                expect($(elem).find('[model-id]').length).toEqual(1);
            }

            var label = $(elem).find('text').find('tspan');
            expect(label[0]).toContainText($scope.shape.label);

        });
    })
});

describe('diagram directive: ', function () {

    var $rootScope;
    var $scope;
    var $compile;
    var $httpBackend;
    var diagramming;
    var elem;

    beforeEach(function () {

        angular.mock.module('owasp-threat-dragon-core');
        angular.mock.inject(function (_$rootScope_, _$compile_, _$httpBackend_, _diagramming_) {
            $rootScope = _$rootScope_;
            $scope = $rootScope.$new();
            $compile = _$compile_;
            diagramming = _diagramming_;
            $httpBackend = _$httpBackend_;
            $httpBackend.expectGET().respond();
        });

        $rootScope.$apply();

        $scope.action = function () { };
        spyOn($scope, 'action');

    });

    describe('basic settings: ', function () {

        var height;
        var width;
        var gridSize;
        var interactive;
        var diagramSvg;
        var viewport;

        beforeEach(function () {

            height = 400;
            width = 600;
            gridSize = 2;
            interactive = true;

            //graph mocks
            var graph = new joint.dia.Graph();;
            spyOn(graph, 'on').and.callThrough();

            //scope mocks
            $scope.graph = graph;
            $scope.initialiseGraph = function () { };
            spyOn($scope, 'initialiseGraph');
            $scope.select = function (element) { };
            spyOn($scope, 'select');
            $scope.newFlow = function () { };
            spyOn($scope, 'newFlow');

            setFixtures('<tmt-diagram height="' + height + '" width="' + width + '" grid-size="' + gridSize + '" interactive="' + interactive + '" graph="graph" initialise-graph="initialiseGraph(diagram)" select="select(element)" new-flow="newFlow(source, target)" />');
            elem = angular.element($('tmt-diagram')[0]);
            $compile(elem)($scope);
            $scope.$digest();
            diagramSvg = $(elem).find('svg');
            viewport = diagramSvg.children('.joint-viewport');

        });

        it('should create a diagram', function () {

            expect(diagramSvg.length).toEqual(1);
            expect(viewport.length).toEqual(1);
            expect($scope.initialiseGraph).toHaveBeenCalled();

        });

        it('should use the height', function () {

            expect(elem.isolateScope().height).toEqual(height);
            //jasmine-jquery toHaveAttr does not work for SVG
            expect(diagramSvg.attr('height')).toEqual('100%');

        });

        it('should use the width', function () {

            expect(elem.isolateScope().width).toEqual(width);
            //jasmine-jquery toHaveAttr does not work for SVG
            expect(diagramSvg.attr('width')).toEqual('100%');

        });

        it('should use the grid size', function () {

            expect(elem.isolateScope().gridSize).toEqual(gridSize);

        });

        it('should use the interactive value', function () {

            expect(elem.isolateScope().interactive).toEqual(interactive);

        });

        it('should move the added cell according to the viewport scroll', function () {

            var cell = new joint.shapes.basic.Rect();
            spyOn(cell, 'translate');
            $scope.graph.trigger('add', cell);
            expect(cell.translate).toHaveBeenCalled();
            expect(cell.translate.calls.argsFor(0)).toEqual([0, 0]);

        });

        describe('interaction tests: ', function () {

            var diagram;

            beforeEach(function () {

                diagram = $scope.initialiseGraph.calls.argsFor(0)[0];

            });

            it('should select a cell', function () {

                var cell = new joint.shapes.basic.Rect();
                $scope.graph.addCell(cell);
                var cellView = diagram.findViewByModel(cell);
                diagram.trigger('cell:pointerclick', cellView);
                expect($scope.select).toHaveBeenCalled();
                expect($scope.select.calls.argsFor(0)).toEqual([cell]);

            });

            it('should select a link', function () {

                var link = new joint.dia.Link({ source: { x: 1, y: 1 }, target: { x: 100, y: 100 } });
                $scope.graph.addCell(link);
                var cellView = diagram.findViewByModel(link);
                diagram.trigger('link:options', cellView, {});
                expect($scope.select).toHaveBeenCalled();
                expect($scope.select.calls.argsFor(0)).toEqual([link]);

            });

            it('should unselect a cell', function () {

                var cell = new joint.shapes.basic.Rect();
                $scope.graph.addCell(cell);
                var cellView = diagram.findViewByModel(cell);
                cellView.setSelected = function () { };
                cellView.setUnselected = function () { };
                cellView.removeLinkFrom = function () { };
                spyOn(cellView, 'setUnselected');
                diagram.setSelected(cell);
                diagram.trigger('blank:pointerclick');
                expect($scope.select).toHaveBeenCalled();
                expect($scope.select.calls.argsFor(0)).toEqual([null]);

            });

            it('should remove the link-from from a selected element when unselecting', function () {

                var cell = new joint.shapes.basic.Rect();
                $scope.graph.addCell(cell);
                var cellView = diagram.findViewByModel(cell);
                cellView.removeLinkFrom = function () { };
                cellView.setSelected = function () { };
                diagram.setSelected(cell);
                spyOn(cellView, 'removeLinkFrom');
                diagram.trigger('blank:pointerclick', null);
                expect(cellView.removeLinkFrom).toHaveBeenCalled();
            });

            it('should replace the selected element', function () {

                var cell1 = new joint.shapes.basic.Rect();
                var cell2 = new joint.shapes.basic.Rect();
                $scope.graph.addCells([cell1, cell2]);
                var cellView1 = diagram.findViewByModel(cell1);
                var cellView2 = diagram.findViewByModel(cell2);
                diagram.trigger('cell:pointerclick', cellView1);
                diagram.trigger('cell:pointerclick', cellView2);
                expect($scope.select.calls.count()).toEqual(2);
                expect($scope.select.calls.argsFor(1)).toEqual([cell2]);

            });

            it('should set/unset the selected properties', function () {

                var cell1 = new joint.shapes.basic.Rect();
                var cell2 = new joint.shapes.basic.Rect();
                $scope.graph.addCells([cell1, cell2]);
                var cellView1 = diagram.findViewByModel(cell1);
                cellView1.setSelected = function () { };
                cellView1.setUnselected = function () { };
                var cellView2 = diagram.findViewByModel(cell2);
                cellView2.setSelected = function () { };
                diagram.setSelected(cell1);
                spyOn(cellView1, 'setUnselected');
                spyOn(cellView2, 'setSelected');
                diagram.setSelected(cell2);
                expect(cellView1.setUnselected).toHaveBeenCalled();
                expect(cellView2.setSelected).toHaveBeenCalled();

            });

            it('should unset the selected property', function () {

                var cell = new joint.shapes.basic.Rect();
                $scope.graph.addCell(cell);
                var cellView = diagram.findViewByModel(cell);
                cellView.setSelected = function () { };
                cellView.setUnselected = function () { };
                diagram.setSelected(cell);
                spyOn(cellView, 'setUnselected');
                diagram.setSelected(null);
                expect(cellView.setUnselected).toHaveBeenCalled();

            });

            it('should set the link-from', function () {

                var cell = new joint.shapes.basic.Rect();
                $scope.graph.addCell(cell);
                var cellView = diagram.findViewByModel(cell);
                cellView.addLinkFrom = function () { };
                spyOn(cellView, 'addLinkFrom');
                cellView._action = 'linkFrom';
                diagram.trigger('cell:pointerclick', cellView);
                expect(cellView.addLinkFrom).toHaveBeenCalled();

            });

            it('should unset the link-from (tool element)', function () {

                var cell = new joint.shapes.basic.Rect();
                $scope.graph.addCell(cell);
                var cellView = diagram.findViewByModel(cell);
                cellView.setSelected = function () { };
                cellView.removeLinkFrom = function () { };
                spyOn(cellView, 'removeLinkFrom');
                diagram.setSelected(cell);
                cellView._action = 'removeLinkFrom';
                diagram.trigger('cell:pointerclick', cellView);
                expect(cellView.removeLinkFrom).toHaveBeenCalled();

            });

            it('should unset the link-from (link select)', function () {

                var cell = new joint.shapes.basic.Rect();
                var link = new joint.dia.Link({ source: { x: 1, y: 1 }, target: { x: 100, y: 100 } });
                $scope.graph.addCell([cell, link]);
                var cellView = diagram.findViewByModel(cell);
                cellView.setSelected = function () { };
                cellView.removeLinkFrom = function () { };
                spyOn(cellView, 'removeLinkFrom');
                diagram.setSelected(cell);
                var linkView = diagram.findViewByModel(link);
                diagram.trigger('link:options', linkView);
                expect(cellView.removeLinkFrom).toHaveBeenCalled();

            });

            it('should link the selected elements', function () {

                var cell1 = new joint.shapes.basic.Rect();
                var cell2 = new joint.shapes.basic.Rect();
                $scope.graph.addCells([cell1, cell2]);
                var cellView1 = diagram.findViewByModel(cell1);
                cellView1.setSelected = function () { };
                cellView1.removeLinkFrom = function () { };
                spyOn(cellView1, 'removeLinkFrom');
                var cellView2 = diagram.findViewByModel(cell2);
                diagram.setSelected(cell1);
                cellView1.linkFrom = true;
                diagram.trigger('cell:pointerclick', cellView2);
                expect(cellView1.removeLinkFrom).toHaveBeenCalled();
                expect($scope.newFlow).toHaveBeenCalled();
                expect($scope.newFlow.calls.argsFor(0)[0].cid).toEqual(cell1.cid);
                expect($scope.newFlow.calls.argsFor(0)[1].cid).toEqual(cell2.cid);

            });

            describe('resize and scroll: ', function () {

                var cell;
                var cellView;
                var parent;
                var x = 80;
                var y = 20;
                var elWidth = 100;
                var elHeight = 100;

                beforeEach(function () {

                    cell = new joint.shapes.basic.Rect();
                    $scope.graph.addCell(cell);
                    cellView = diagram.findViewByModel(cell);
                    parent = $(elem).parent();
                    parent.css('overflow', 'auto');
                    parent.css('width', elWidth.toString());
                    parent.css('height', elHeight.toString());

                });

                it('should constrain movement to x >= 0', function () {

                    spyOn(cellView, 'getBBox').and.returnValue({ x: -5, y: 100 });
                    spyOn(cellView, 'pointermove');

                    diagram.trigger('cell:pointermove', cellView, null, x, y);
                    expect(cellView.pointermove).toHaveBeenCalled();
                    expect(cellView.pointermove.calls.argsFor(0)[1]).toEqual(x + gridSize);

                });

                it('should constrain movement to y >= 0', function () {

                    spyOn(cellView, 'getBBox').and.returnValue({ x: 50, y: -5 });
                    spyOn(cellView, 'pointermove');

                    diagram.trigger('cell:pointermove', cellView, null, x, y);
                    expect(cellView.pointermove).toHaveBeenCalled();
                    expect(cellView.pointermove.calls.argsFor(0)[2]).toEqual(y + gridSize);

                });

                it('should scroll left', function () {

                    parent.scrollLeft(50);
                    var bboxx = 2;
                    spyOn(cellView, 'getBBox').and.returnValue({ x: bboxx, y: 50 });

                    diagram.trigger('cell:pointermove', cellView, null, x, y);
                    expect(Math.round(parent.scrollLeft())).toEqual(bboxx);

                });

                it('should scroll up', function () {

                    parent.scrollTop(50);
                    var bboxy = 2;
                    spyOn(cellView, 'getBBox').and.returnValue({ x: 50, y: bboxy });

                    diagram.trigger('cell:pointermove', cellView, null, x, y);
                    expect(Math.round(parent.scrollTop())).toEqual(bboxy);

                });

                //this test behaves differently on firefox
                //on ff parent.width() = 100, on other browser it = 70
                it('should scroll the diagram to the right', function () {

                    parent.scrollLeft(50);
                    var bboxwidth = 100;
                    spyOn(cellView, 'getBBox').and.returnValue({ x: x, y: 50, width: bboxwidth });
                    diagram.trigger('cell:pointermove', cellView, null, x, y);
                    expect(Math.round(parent.scrollLeft())).toEqual(Math.round(x + bboxwidth - parent.width()));

                });

                it('should scroll down', function () {

                    parent.scrollTop(50);
                    var bboxheight = 100;
                    spyOn(cellView, 'getBBox').and.returnValue({ x: x, y: y, height: bboxheight });

                    diagram.trigger('cell:pointermove', cellView, null, x, y);
                    expect(Math.round(parent.scrollTop())).toEqual(Math.round(y + bboxheight - parent.height()));

                });

                it('should expand the diagram to the right', function () {

                    parent.scrollLeft(50);
                    var bboxx = 550;
                    var bboxwidth = 100;
                    spyOn(cellView, 'getBBox').and.returnValue({ x: bboxx, y: 50, width: bboxwidth });
                    spyOn(diagram, 'setDimensions').and.callThrough();

                    diagram.trigger('cell:pointermove', cellView, null, x, y);
                    expect(Math.round(parent.scrollLeft())).toEqual(bboxx + bboxwidth - width);
                    expect(diagram.setDimensions).toHaveBeenCalled();
                    expect(diagram.setDimensions.calls.argsFor(0)).toEqual([bboxx + bboxwidth, height - 10]);

                });

                it('should expand the diagram down', function () {

                    parent.scrollTop(50);
                    var bboxy = 350;
                    var bboxheight = 100;
                    spyOn(cellView, 'getBBox').and.returnValue({ x: 50, y: bboxy, height: bboxheight });
                    spyOn(diagram, 'setDimensions').and.callThrough();
                    var x = 10;
                    var y = 20;

                    diagram.trigger('cell:pointermove', cellView, null, x, y);
                    expect(Math.round(parent.scrollTop())).toEqual(bboxy + bboxheight - height);
                    expect(diagram.setDimensions).toHaveBeenCalled();
                    expect(diagram.setDimensions.calls.argsFor(0)).toEqual([width - 10, bboxy + bboxheight]);

                });
            });
        });
    });
});