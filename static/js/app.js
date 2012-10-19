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
    var input, output;
    SIGNAL.views.app = new SIGNAL.Views.App({});
    SIGNAL.views.app.render();
    input = new SIGNAL.Models.Data();
    SIGNAL.models.input = input;
    SIGNAL.views.input = new SIGNAL.Views.DataInput({
      model: SIGNAL.models.input,
      el: '#signal-input'
    });
    SIGNAL.views.input.render();
    output = new SIGNAL.Models.Data({
      useFilter: true
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
      var startSample, startTimeDelay,
        _this = this;
      this.$formulaInput = $('#formula-input');
      $('#use-random').on('click', function() {
        return SIGNAL.views.input.useRandom = true;
      });
      $('#use-formula').on('click', function() {
        return SIGNAL.views.input.useRandom = false;
      });
      this.$samples = $('#numSamples');
      this.$samplesLabel = $('#samplesLabel');
      startSample = 10;
      this.$samplesLabel.html(startSample);
      this.$timeDelay = $('#timeDelay');
      this.$timeDelayLabel = $('#timeDelayLabel');
      startTimeDelay = 200;
      this.$timeDelayLabel.html(startTimeDelay);
      this.$filterAmount = $('#filterAmount');
      this.$filterAmountLabel = $('#filterAmountLabel');
      this.$filterAmountLabel.html("1.0");
      this.$timeDelay.slider({
        min: 1,
        max: 800,
        value: 200,
        animate: false,
        slide: function(event, ui) {
          SIGNAL.models.output.set({
            timeDelay: parseInt(ui.value, 10)
          });
          SIGNAL.models.input.set({
            timeDelay: parseInt(ui.value, 10)
          });
          return _this.$timeDelayLabel.html(ui.value);
        }
      });
      this.$samples.slider({
        min: 0,
        max: 40,
        value: startSample,
        animate: true,
        slide: function(event, ui) {
          SIGNAL.models.output.set({
            nSamples: parseInt(ui.value, 10)
          });
          return _this.$samplesLabel.html(ui.value);
        }
      });
      this.$filterAmount.slider({
        min: -100,
        max: 200,
        value: 100,
        animate: false,
        slide: function(event, ui) {
          var filterAmount, samples, val;
          val = ui.value / 100;
          samples = SIGNAL.models.output.get('nSamples');
          if (samples > 0) {
            filterAmount = val / samples;
          } else {
            filterAmount = val;
          }
          SIGNAL.models.output.set({
            filterAmount: parseFloat(filterAmount)
          });
          return _this.$filterAmountLabel.html(parseFloat(val) + '');
        }
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

    Data.prototype.defaults = {
      nSamples: 10,
      timeDelay: 200,
      filterAmount: void 0,
      useFilter: false
    };

    Data.prototype.initialize = function() {
      return this.set({
        filterAmount: 1 / this.get('nSamples')
      });
    };

    Data.prototype.getCurData = function() {
      var curVal, data, filterAmount, i, index, len, nSamples, start;
      data = SIGNAL.models.input.get('data');
      len = data.length;
      nSamples = this.get('nSamples');
      filterAmount = this.get('filterAmount');
      start = len - (nSamples / 2) - 1;
      curVal = 0;
      if (nSamples > 0) {
        for (i = 0; 0 <= nSamples ? i <= nSamples : i >= nSamples; 0 <= nSamples ? i++ : i--) {
          index = start + ((nSamples / 2) * -1) + i;
          curVal += data[index] * filterAmount;
        }
      } else {
        curVal = data[len - 1];
        if (filterAmount) curVal = curVal * filterAmount;
      }
      return curVal;
    };

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
      this.n = 48;
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
      return Math.sin(this.tick);
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
        curData = this.getFormula();
      }
      if (this.model.get('useFilter')) curData = this.model.getCurData();
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
      }, this.model.get('timeDelay'));
      return this;
    };

    DataInput.prototype.redraw = function(curData) {
      var _this = this;
      this.signalPath.attr("d", this.line).attr("transform", null).transition().duration(this.model.get('timeDelay')).ease("linear").attr("transform", "translate(" + this.xScale(-1) + ")");
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
