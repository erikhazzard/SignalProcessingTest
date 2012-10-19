# ===========================================================================
#
# app.coffee
#
# Sets up namespacing and the app itself
# ===========================================================================
SIGNAL = (()=>

    # POLY FILLS
    window.requestAnimFrame = ( ()->
      return  window.requestAnimationFrame       ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame    ||
              window.oRequestAnimationFrame      ||
              window.msRequestAnimationFrame     ||
              (callback, element)->
                window.setTimeout(callback, 1000 / 60)
    )()


    #Public API returned
    return {
        #Classes
        Models: {},
        Views: {},

        #objects
        views: {},
        models: {},
        
        app: {},
        functions: {},

        inputData: [],
    }

)()

window.SIGNAL = SIGNAL

# ===========================================================================
#
# Init
#
# ===========================================================================
SIGNAL.functions.init = ()=>
    #Render the app
    #------------------------------------
    SIGNAL.views.app = new SIGNAL.Views.App({})
    SIGNAL.views.app.render()

    #input signal
    #------------------------------------
    input = new SIGNAL.Models.Data()
    SIGNAL.models.input = input

    #Create view and tender it
    SIGNAL.views.input = new SIGNAL.Views.DataInput({
        model: SIGNAL.models.input
        el: '#signal-input'
    })
    SIGNAL.views.input.render()

    #output signal
    #------------------------------------
    #Set the sample amount (how many points to sample before and after
    #   some point)
    nSamples = 10
    #Specify the filter coefficient
    #   If it goes above 1, we're effectively amplifying the signal
    filterAmount = 1 / nSamples

    output = new SIGNAL.Models.Data({
        getCurData: ()=>
            #Store refs to input data 
            #   data is the INPUT data
            data = SIGNAL.models.input.get('data')
            len = data.length

            #Pick the 'mid' point to start at (between sample length)
            #start = len - nSamples / 2
            start = len - 3

            #TODO: let user choose num samples
            
            #Calculate the current value based on n/2 samples before and after 
            #   the current value
            curVal = (
                ( (data[start] - 2) * 0.2 )
                + ( (data[start] - 1) * 0.2 )
                + ( (data[start] - 0) * 0.2 )
                + ( (data[start] + 1) * 0.2 )
                + ( (data[start] + 2) * 0.2 )
            )

            return curVal
    })
    SIGNAL.models.output = output

    SIGNAL.views.output= new SIGNAL.Views.DataInput({
        model: SIGNAL.models.output
        el: '#signal-output'
    })
    SIGNAL.views.output.render()

    return true

# ===========================================================================
#
# APP view
# 
# ===========================================================================
class SIGNAL.Views.App extends Backbone.View
    el: "body"
    initialize: ()=>
        return @

    render: ()=>
        #Add event listeners
        @$formulaInput = $('#formula-input')

        $('#use-random').on('click', ()=>
            SIGNAL.views.input.useRandom = true
        )
        $('#use-formula').on('click', ()=>
            SIGNAL.views.input.useRandom = false
        )

        return @

# ===========================================================================
# Signal Processing view
# ===========================================================================
# ===========================================================================
# Model
# ===========================================================================
class SIGNAL.Models.Data extends Backbone.Model

# ===========================================================================
#
# Setup the input view
# 
# ===========================================================================
class SIGNAL.Views.DataInput extends Backbone.View
    el: 'body'
    #View for the input graph

    initialize: ()=>
        @el = @options.el
        @timeDelay = 220
        @n = 30
        @tick = 0

        @useRandom = false
        
        #Default, use 0 for starting values
        @random = d3.random.normal(0,0)
        @randomStart = 0
        @randomEnd = 0.4
        
        if @useRandom
            #If random, use random values
            @random = @getRandom

        #Create and store some input data
        @model.set({ 'data': d3.range(@n).map(@random) })

        return @

    #------------------------------------
    #Data value helpers
    #------------------------------------
    getRandom: ()=>
        return ()=>
            -2 + Math.random() * 4.0
        #return d3.random.normal(@randomStart, @randomEnd)
        
    getFormula: ()=>
        return ()=>
            Math.sin(@tick)

    #------------------------------------
    #Render
    #------------------------------------
    render: ()=>
        #Sets up the SVG elements
        @margin = {
            top: 20,
            left: 40,
            right: 10,
            bottom: 20
        }
        
        @svg = d3.select(@el)
        @width = @svg.attr('width') - (@margin.left + @margin.right)
        @height = @svg.attr('height') - (@margin.top + @margin.bottom)

        #Store ref to data
        data = @model.get('data')

        #Setup scales
        #--------------------------------
        @xScale = d3.scale.linear()
            .domain([0, @n - 1])
            .range([0, @width])
        @yScale = d3.scale.linear()
            .domain([-2, 2])
            .rangeRound([@height, 0])
    
        #Setup the chart group wrapper
        #--------------------------------
        @chart = @svg
            .append("g")
                .attr("transform",
                    "translate(" + [@margin.left, @margin.top] + ")")

        #line function to create a line for the path
        @line = d3.svg.line()
            .x((d, i) =>
                return @xScale(i)
            )
            .y((d, i) =>
                return @yScale(d)
            )

    
        #Setup clip path to hide extra line section
        @chart.append("defs").append("clipPath")
            .attr("id", "clip")
                .append("rect")
                .attr("width", @width)
                .attr("height", @height)

        @chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + @height + ")")
            .call(d3.svg.axis().scale(@xScale).orient("bottom"))

        @chart.append("g")
            .attr("class", "y axis")
            .call(d3.svg.axis().scale(@yScale).orient("left"))

        #Create the signal path, which will be updated 
        #   every @timeDelay ms
        @signalPath = @chart.append("g")
            .attr("clip-path", "url(#clip)")
                .append("path")
                .data([data])
                .attr("class", "line")
                .attr("d", @line)

        #Add text to show current value
        @signalText = @svg.append('g')
            .append('svg:text')
            .data([data])
            .text('0')
                .attr({
                    x: @width / 2
                    y: '16px'
                })
                .style({
                    'font-size': '16px'
                })

        #Update data every tick
        #   Note: we could get from server instead
        @dataTimer()
        return @

    #------------------------------------
    #Helper functions 
    #------------------------------------
    dataTimer: ()=>
        #Setup timer to update data every @timeDelay ms
        
        #keep track of ticks so we can 'reset' it
        @tick += 1
        if @tick > 5000
            @tick = 0

        #Update the data
        #--------------------------------
        data = @model.get('data')

        #Data to add
        #--------------------------------
        if @useRandom
            curData = @getRandom()()
        else
            curData = @getFormula()()

        #If there is a getCurData function provided, use it instead
        #   (We do this for the output graph)
        if @model.get('getCurData')
            curData = @model.get('getCurData')()

        #Add the current data
        data.push(curData)

        #Update the model
        #--------------------------------
        @model.set({data: data})

        #Redraw it, passing in value of current data
        #--------------------------------
        @redraw(curData)

        #Remove old data point
        data.shift()

        #Update the model
        #--------------------------------
        @model.set({data: data})

        #Keep calling it, but on a delay
        #--------------------------------
        setTimeout( ()=>
            requestAnimFrame(()=>
                @dataTimer()
            )
        ,@timeDelay
        )

        return @


    #Define redrew function
    redraw: (curData)=>
        #Update the signal path
        @signalPath
            .attr("d", @line)
            .attr("transform", null)
            .transition()
            .duration(@timeDelay)
            .ease("linear")
            .attr("transform", "translate(" + @xScale(-1) + ")")
            #Could have it call itself
            #.each("end", @tick)

        #update text
        @signalText.text((d,i)=>
            return curData
        )

        return @

# ===========================================================================
# Dom ready
# ===========================================================================
$(document).ready(()=>
    SIGNAL.functions.init()
    return @
)
