(function() {
  var SIGNAL,
    _this = this,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  SIGNAL = (function() {
    window.requestAnimFrame = (function() {
      return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback, element) {
        return window.setTimeout(callback, 1000 / 60);
      };
    })();
    return {
      Models: {},
      Views: {},
      views: {},
      models: {},
      app: {},
      functions: {},
      inputData: []
    };
  })();

  window.SIGNAL = SIGNAL;

  SIGNAL.functions.init = function() {
    var input;
    input = new Backbone.Model({});
    SIGNAL.models.input = input;
    SIGNAL.views.input = new SIGNAL.Views.DataInput({
      model: SIGNAL.models.input
    });
    SIGNAL.views.input.render();
    return true;
  };

  SIGNAL.Views.DataInput = (function(_super) {

    __extends(DataInput, _super);

    function DataInput() {
      this.redraw = __bind(this.redraw, this);
      this.dataTimer = __bind(this.dataTimer, this);
      this.render = __bind(this.render, this);
      this.initialize = __bind(this.initialize, this);
      DataInput.__super__.constructor.apply(this, arguments);
    }

    DataInput.prototype.el = 'body';

    DataInput.prototype.initialize = function() {
      var _this = this;
      this.startTime = 1350628512531;
      this.val = 70;
      this.timeDelay = 100;
      this.next = function() {
        return {
          time: ++_this.startTime,
          value: _this.val = ~~Math.max(10, Math.min(90, _this.val + 10 * (Math.random() - .5)))
        };
      };
      this.model.set({
        'data': d3.range(33).map(this.next)
      });
      return this;
    };

    DataInput.prototype.render = function() {
      var data,
        _this = this;
      this.width = 20;
      this.height = 80;
      data = this.model.get('data');
      this.xScale = d3.scale.linear().domain([0, 1]).range([0, this.width]);
      this.yScale = d3.scale.linear().domain([0, 100]).rangeRound([0, this.height]);
      this.chart = d3.select("#signal-input").attr("class", "chart").attr("width", this.width * data.length - 1).attr("height", this.height);
      this.chart.selectAll("rect").data(data).enter().append("rect").attr("x", function(d, i) {
        return _this.xScale(i) - .5;
      }).attr("y", function(d) {
        return _this.height - _this.yScale(d.value) - .5;
      }).attr("width", this.width).attr("height", function(d) {
        return _this.yScale(d.value);
      });
      this.chart.append("line").attr("x1", 0).attr("x2", this.width * data.length).attr("y1", this.height - .5).attr("y2", this.height - .5).style("stroke", "#000");
      this.dataTimer();
      return this;
    };

    DataInput.prototype.dataTimer = function() {
      var data,
        _this = this;
      console.log('called');
      data = this.model.get('data');
      data.shift();
      data.push(this.next());
      this.model.set({
        data: data
      });
      this.redraw();
      setTimeout(function() {
        return requestAnimFrame(function() {
          return _this.dataTimer();
        });
      }, this.timeDelay);
      return this;
    };

    DataInput.prototype.redraw = function() {
      var rect,
        _this = this;
      rect = this.chart.selectAll("rect").data(this.model.get('data'), function(d) {
        return d.time;
      });
      rect.enter().insert("rect", "line").attr("x", function(d, i) {
        return _this.xScale(i + 1) - .5;
      }).attr("y", function(d) {
        return _this.height - _this.yScale(d.value) - .5;
      }).attr("width", this.width).attr("height", function(d) {
        return _this.yScale(d.value);
      }).transition().duration(this.timeDelay).attr("x", function(d, i) {
        return _this.xScale(i) - .5;
      });
      rect.transition().duration(this.timeDelay).attr("x", function(d, i) {
        return _this.xScale(i) - .5;
      });
      rect.exit().transition().duration(this.timeDelay).attr("x", function(d, i) {
        return _this.xScale(i - 1) - .5;
      }).remove();
      return this;
    };

    return DataInput;

  })(Backbone.View);

  $(document).ready(function() {
    SIGNAL.functions.init();
    return _this;
  });

}).call(this);
