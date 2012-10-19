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
    #Setup stuff when page loads 
    input = new Backbone.Model({})
    SIGNAL.models.input = input

    #Create view and tender it
    SIGNAL.views.input = new SIGNAL.Views.DataInput({
        model: SIGNAL.models.input
    })
    SIGNAL.views.input.render()

    return true

# ===========================================================================
#
# Setup the input view
# 
# ===========================================================================
class SIGNAL.Views.DataInput extends Backbone.View
    el: 'body'
    #View for the input graph

    initialize: ()=>
        @startTime = 1350628512531
        @val = 70
        @timeDelay = 100

        #Generate some data
        @next = ()=>
            return {
                time: ++@startTime,
                value: @val = ~~Math.max(10, Math.min(90, @val + 10 * (Math.random() - .5)))
            }

        #Create and store some input data
        @model.set({ 'data': d3.range(33).map(@next) })

        return @

    render: ()=>
        #Sets up the SVG elements
        @width = 20
        @height = 80

        #Store ref to data
        data = @model.get('data')

        @xScale = d3.scale.linear()
            .domain([0, 1])
            .range([0, @width])
        @yScale = d3.scale.linear()
            .domain([0, 100])
            .rangeRound([0, @height])

        @chart = d3.select("#signal-input")
            .attr("class", "chart")
            .attr("width", @width * data.length - 1)
            .attr("height", @height)
        
        #Add initial bars
        @chart.selectAll("rect")
            .data(data)
            .enter().append("rect")
                .attr("x", (d, i)=>
                    return @xScale(i) - .5
                )
                .attr("y", (d)=>
                    return @height - @yScale(d.value) - .5
                )
                .attr("width", @width)
                .attr("height", (d)=>
                    return @yScale(d.value)
                )

        #Add axis
        @chart.append("line")
            .attr("x1", 0)
            .attr("x2", @width * data.length)
            .attr("y1", @height - .5)
            .attr("y2", @height - .5)
            .style("stroke", "#000")

        #Update data every tick
        #   Note: we could get from server instead
        @dataTimer()
        return @

    #------------------------------------
    #Helper functions 
    #------------------------------------
    dataTimer: ()=>
        #Setup timer to update data every 1 second
        console.log('called')

        #Update the data
        data = @model.get('data')
        data.shift()
        data.push(@next())

        #Update the model
        @model.set({data: data})

        #Redraw it
        @redraw()

        #Keep calling it, but on a delay
        setTimeout( ()=>
            requestAnimFrame(()=>
                @dataTimer()
            )
        ,@timeDelay
        )

        return @


    #Define redrew function
    redraw: ()=>
        #This function will redraw the graph
        rect = @chart.selectAll("rect")
            .data(@model.get('data'), (d)=>
                return d.time
            )
        
        #Create new rect
        rect.enter().insert("rect", "line")
            .attr("x", (d, i)=>
                return @xScale(i + 1) - .5
            )
            .attr("y", (d)=>
                return @height - @yScale(d.value) - .5
            )
            .attr("width", @width)
            .attr("height", (d)=>
                return @yScale(d.value)
            )
            .transition()
                .duration(@timeDelay)
                .attr("x", (d, i)=>
                    return @xScale(i) - .5
                )

        #Move the rect over
        rect.transition()
            .duration(@timeDelay)
            .attr("x", (d, i)=>
                return @xScale(i) - .5
            )

        #Remove the last point
        rect.exit().transition()
            .duration(@timeDelay)
            .attr("x", (d, i)=>
                return @xScale(i - 1) - .5
            )
            .remove()

        return @

# ===========================================================================
# Dom ready
# ===========================================================================
$(document).ready(()=>
    SIGNAL.functions.init()
    return @
)
