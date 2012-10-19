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
    var filterAmount, input, nSamples, output;
    SIGNAL.views.app = new SIGNAL.Views.App({});
    SIGNAL.views.app.render();
    input = new SIGNAL.Models.Data();
    SIGNAL.models.input = input;
    SIGNAL.views.input = new SIGNAL.Views.DataInput({
      model: SIGNAL.models.input,
      el: '#signal-input'
    });
    SIGNAL.views.input.render();
    nSamples = 10;
    filterAmount = 1 / nSamples;
    output = new SIGNAL.Models.Data({
      getCurData: function() {
        var curVal, data, len, start;
        data = SIGNAL.models.input.get('data');
        len = data.length;
        start = len - 3;
        curVal = ((data[start] - 2) * 0.2, +((data[start] - 1) * 0.2), +((data[start] - 0) * 0.2), +((data[start] + 1) * 0.2), +((data[start] + 2) * 0.2));
        return curVal;
      }
    });
    SIGNAL.models.output = output;
    SIGNAL.views.output = new SIGNAL.Views.DataInput({
      model: SIGNAL.models.output,
      el: '#signal-output'
    });
    SIGNAL.views.output.render();
    return true;
  };

  SIGNAL.Views.App = (function(_super) {

    __extends(App, _super);

    function App() {
      this.render = __bind(this.render, this);
      this.initialize = __bind(this.initialize, this);
      App.__super__.constructor.apply(this, arguments);
    }

    App.prototype.el = "body";

    App.prototype.initialize = function() {
      return this;
    };

    App.prototype.render = function() {
      var _this = this;
      this.$formulaInput = $('#formula-input');
      $('#use-random').on('click', function() {
        return SIGNAL.views.input.useRandom = true;
      });
      $('#use-formula').on('click', function() {
        return SIGNAL.views.input.useRandom = false;
      });
      return this;
    };

    return App;

  })(Backbone.View);

  SIGNAL.Models.Data = (function(_super) {

    __extends(Data, _super);

    function Data() {
      Data.__super__.constructor.apply(this, arguments);
    }

    return Data;

  })(Backbone.Model);

  SIGNAL.Views.DataInput = (function(_super) {

    __extends(DataInput, _super);

    function DataInput() {
      this.redraw = __bind(this.redraw, this);
      this.dataTimer = __bind(this.dataTimer, this);
      this.render = __bind(this.render, this);
      this.getFormula = __bind(this.getFormula, this);
      this.getRandom = __bind(this.getRandom, this);
      this.initialize = __bind(this.initialize, this);
      DataInput.__super__.constructor.apply(this, arguments);
    }

    DataInput.prototype.el = 'body';

    DataInput.prototype.initialize = function() {
      this.el = this.options.el;
      this.timeDelay = 220;
      this.n = 30;
      this.tick = 0;
      this.useRandom = false;
      this.random = d3.random.normal(0, 0);
      this.randomStart = 0;
      this.randomEnd = 0.4;
      if (this.useRandom) this.random = this.getRandom;
      this.model.set({
        'data': d3.range(this.n).map(this.random)
      });
      return this;
    };

    DataInput.prototype.getRandom = function() {
      var _this = this;
      return function() {
        return -2 + Math.random() * 4.0;
      };
    };

    DataInput.prototype.getFormula = function() {
      var _this = this;
      return function() {
        return Math.sin(_this.tick);
      };
    };

    DataInput.prototype.render = function() {
      var data,
        _this = this;
      this.margin = {
        top: 20,
        left: 40,
        right: 10,
        bottom: 20
      };
      this.svg = d3.select(this.el);
      this.width = this.svg.attr('width') - (this.margin.left + this.margin.right);
      this.height = this.svg.attr('height') - (this.margin.top + this.margin.bottom);
      data = this.model.get('data');
      this.xScale = d3.scale.linear().domain([0, this.n - 1]).range([0, this.width]);
      this.yScale = d3.scale.linear().domain([-2, 2]).rangeRound([this.height, 0]);
      this.chart = this.svg.append("g").attr("transform", "translate(" + [this.margin.left, this.margin.top] + ")");
      this.line = d3.svg.line().x(function(d, i) {
        return _this.xScale(i);
      }).y(function(d, i) {
        return _this.yScale(d);
      });
      this.chart.append("defs").append("clipPath").attr("id", "clip").append("rect").attr("width", this.width).attr("height", this.height);
      this.chart.append("g").attr("class", "x axis").attr("transform", "translate(0," + this.height + ")").call(d3.svg.axis().scale(this.xScale).orient("bottom"));
      this.chart.append("g").attr("class", "y axis").call(d3.svg.axis().scale(this.yScale).orient("left"));
      this.signalPath = this.chart.append("g").attr("clip-path", "url(#clip)").append("path").data([data]).attr("class", "line").attr("d", this.line);
      this.signalText = this.svg.append('g').append('svg:text').data([data]).text('0').attr({
        x: this.width / 2,
        y: '16px'
      }).style({
        'font-size': '16px'
      });
      this.dataTimer();
      return this;
    };

    DataInput.prototype.dataTimer = function() {
      var curData, data,
        _this = this;
      this.tick += 1;
      if (this.tick > 5000) this.tick = 0;
      data = this.model.get('data');
      if (this.useRandom) {
        curData = this.getRandom()();
      } else {
        curData = this.getFormula()();
      }
      if (this.model.get('getCurData')) curData = this.model.get('getCurData')();
      data.push(curData);
      this.model.set({
        data: data
      });
      this.redraw(curData);
      data.shift();
      this.model.set({
        data: data
      });
      setTimeout(function() {
        return requestAnimFrame(function() {
          return _this.dataTimer();
        });
      }, this.timeDelay);
      return this;
    };

    DataInput.prototype.redraw = function(curData) {
      var _this = this;
      this.signalPath.attr("d", this.line).attr("transform", null).transition().duration(this.timeDelay).ease("linear").attr("transform", "translate(" + this.xScale(-1) + ")");
      this.signalText.text(function(d, i) {
        return curData;
      });
      return this;
    };

    return DataInput;

  })(Backbone.View);

  $(document).ready(function() {
    SIGNAL.functions.init();
    return _this;
  });

}).call(this);
