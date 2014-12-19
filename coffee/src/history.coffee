((context, factory)->
	if typeof define is 'function' and define.amd
		define([], factory);

	else if typeof module isnt 'undefined' and module.exports
		module.exports = factory()

	else
		context["ObjectHistory"] = factory()

	return
)(@, () ->

	###
	Basic helper functions
	###

	###
	# Checks if given value is type of something
	###

	isType = ( val, type ) ->
		classToType =
			'[object Boolean]': 'boolean'
			'[object Number]': 'number'
			'[object String]': 'string'
			'[object Function]': 'function'
			'[object Array]': 'array'
			'[object Date]': 'date'
			'[object RegExp]': 'regexp'
			'[object Object]': 'object'
			'[object Null]': 'null'
			'[object Undefined]': 'undefined'

		classToType[Object::toString.call(val)] is type

	fixNumber = ( val ) ->
		val = +val if isType( val, "number" )
		return val

	###
	# Reads value from object through path
	# @param obj {Object}
	# @param path {String} - e.g. 'a.foo.1.bar'
	###

	deepGet = (obj, path) ->
		# reversing the path to use Array::pop()
		path = (path.split ".").reverse().map( fixNumber ) if not isType( path, "array" )
		key = path.pop()

		# if we reach the end of the path, or the current value is undefined
		# return the current value
		if path.length is 0 or not Object::hasOwnProperty.call(obj, key)
			return obj[key]

		deepGet obj[key], path

	###
	# Writes value to object through path
	# @param obj {Object}
	# @param path {String} - e.g. 'a.foo.bar'
	# @param value {Mixed}
	# @param create {Boolean} - whether it should build non-existent tree or not
	###

	deepSet = (obj, path, value, create) ->
		create = true if not create? or create is undefined
		# reversing the path to use Array::pop()
		path = (path.split ".").reverse().map( fixNumber ) if not isType( path, "array" )
		key = path.pop()

		if path.length is 0
			return obj[key] = value

		if not Object::hasOwnProperty.call(obj, key) or obj[key] is undefined
			if create is on
				# if next key is number create an array, else create object
				if isType( path[path.length-1], "number" )
					obj[key] = []
				else
					obj[key] = {}
			else 
				throw new Error("Value not set, because creation is set to false!")

		deepSet obj[key], path, value, create
		return


	###
	# Checks if path is in a whitelisted place
	###

	isInList = (path, whitelist) ->
		# if whitelist is empty or not defined, instantly whitelist path
		return true if not whitelist? or whitelist is undefined or (whitelist.length and whitelist.length is 0)

		matches = 0
		for item in whitelist
			# increment matches if path starts with whitelist item or vica versa
			matches++ if path.indexOf( item ) isnt -1 or item.indexOf( path ) isnt -1
		matches > 0

	###
	End of helper functions
	###


	# History prototype

	class History
		constructor: () ->
			@_backwards = []
			@_forwards = []
		
		options:
			maxLength: 100
			emptyOnSet: on
			bypassRecording: off

		record: ( state ) ->
			return if @options.bypassRecording is on
			state.type = "update" if state.type is undefined
			@_backwards.push( state )
			# empty forward history if set
			@_forwards = [] if @options.emptyOnSet is on
			# remove first item in history if reached limit
			@_backwards.shift() if @_backwards.length > @options.maxLength
			return


	###
	# History functions
	###


	undo = () ->
		# return instantly if no record in forward history
		return if @__History__._backwards.length is 0
		@__History__.options.bypassRecording = on
		temp = @__History__.options.emptyOnSet
		@__History__.options.emptyOnSet = off
		# get the next step from backwards history
		step = @__History__._backwards.pop()

		# set current state
		switch step.type
			when "delete" then ( (origin, step) ->
				define( origin, step.path, step.value )
				origin.__History__._forwards.push path: step.path, value: step.value, type: "delete"
			)(@, step)
			when "add" then ( (origin, step) ->
				path = step.path.split(".")
				key = path.pop()
				savePath = path.join(".")
				obj = deepGet( origin, savePath )
				remove( origin, obj, step.path, key )
				origin.__History__._forwards.push path: step.path, value: step.value, type: "add"
			)(@, step)
			when "update" then ( (origin, step) ->
				origin.__History__._forwards.push path: step.path, value: deepGet(origin, step.path), type: "update"
				deepSet( origin, step.path, step.value )
			)(@, step)

		@__History__.options.emptyOnSet = temp
		@__History__.options.bypassRecording = off
		return



	redo = () ->
		# return instantly if no record in forward history
		return if @__History__._forwards.length is 0
		@__History__.options.bypassRecording = on
		temp = @__History__.options.emptyOnSet
		@__History__.options.emptyOnSet = off
		# get the next step from forwards history
		step = @__History__._forwards.pop()

		# set current state
		switch step.type
			when "delete" then ( (origin, step) ->
				path = step.path.split(".")
				key = path.pop()
				savePath = path.join(".")
				obj = deepGet( origin, savePath )
				remove( origin, obj, step.path, key )
				origin.__History__._backwards.push path: step.path, value: step.value, type: "delete"
			)(@, step)
			when "add" then ( (origin, step) ->
				define( origin, step.path, step.value )
				origin.__History__._backwards.push path: step.path, value: step.value, type: "add"
			)(@, step)
			when "update" then ( (origin, step) ->
				origin.__History__._backwards.push path: step.path, value: deepGet(origin, step.path), type: "update"
				deepSet( origin, step.path, step.value )
			)(@, step)

		@__History__.options.emptyOnSet = temp
		@__History__.options.bypassRecording = off
		return


	define = ( origin, path, value ) ->
		if deepGet( origin, path ) is undefined
			deepSet( origin, path, value, true )
		origin.__History__.record( path: path, value: value, type: "add" )
		observe( origin, [path] )
		return


	remove = ( origin, obj, path, key ) ->
		origin.__History__.record( path: path, value: obj[key], type: "delete" )
		delete obj[key]
		return


	###
	# End of history functions
	###




	observe = (obj, whitelist, extension = false, deep = true, origin, path) ->
		origin = obj if not origin? or origin is undefined
		path = [] if not path? or path is undefined
		path = path.split( "." ) if not isType( path, "array" )
		savePath = path.join(".")

		# extend the object with whitelist values here if extension is on
		# extend only if whitelist is an array
		if extension is on and isType( whitelist, "array" )
			# handle every item in whitelist as paths, so we can define them with deepSet() easily
			for path in whitelist
				do ( path ) ->
					# if path is undefined in the object define it with null value
					if deepGet( obj, path ) is undefined
						deepSet( obj, path, null, true )
					return
		# turn extension off, to be sure we only try to extend once
		extension = off
		# end of extension

		# if starting to record extend the object with a non-enumerable History object,
		# which handles the overall history,
		# and extend whitelisted values with the capability of undoing and redoing

		# only register __History__, redo and undo, if they're not present
		# using option enumerable: false is for preventing the History related properties to show in Object.keys()
		# configurable set to true to keep the possibility of property deletion
		# writable is set to false because we dont want users to mess with it!
		if not origin.hasOwnProperty( "__History__" )
			Object.defineProperty origin, "__History__",
				enumerable: false
				configurable: true
				value: new History()

		if not origin.hasOwnProperty( "undo" )
			Object.defineProperty origin, "undo",
				configurable: true
				enumerable: false
				writable: false
				value: ( n ) ->
					n = 1 if not isType( n, "number" )
					while n--
						undo.call( origin )
					return

		if not origin.hasOwnProperty( "redo" )
			Object.defineProperty origin, "redo",
				configurable: true
				enumerable: false
				writable: false
				value: ( n ) ->
					n = 1 if not isType( n, "number" )
					while n--
						redo.call( origin )
					return

		# register define and remove function to every object
		# if property is defined through this function,
		# it will also be deeply observable
		# remove is saving current value before actually removing the item

		if isType( obj, "object" ) or isType( obj, "array" ) and not obj.hasOwnProperty( "define" ) and not obj.hasOwnProperty( "remove" )
			(->
				Object.defineProperty obj, "define",
					configurable: true
					enumerable: false
					writable: false
					value: ( key, value ) ->
						path.push(key)
						savePath = path.join(".")
						path.pop()
						define( origin, savePath, value )
						return

				Object.defineProperty obj, "remove",
					configurable: true
					enumerable: false
					writable: false
					value: ( key ) ->
						path.push(key)
						savePath = path.join(".")
						path.pop()
						remove( origin, obj, savePath, key )
						return
			)(origin, obj, path)

		# register observe and unobserve function to everything
		# unobserve is blacklisting the given path
		if not obj.hasOwnProperty( "unobserve" )
			Object.defineProperty obj, "unobserve",
				configurable: true
				enumerable: false
				writable: false
				value: ( path ) ->
					if not path? or path is undefined
						unobserve( origin, [savePath] )
					else
						unobserve( obj, [path] )
					return
		
		if not obj.hasOwnProperty( "observe" )
			Object.defineProperty obj, "observe",
				configurable: true
				enumerable: false
				writable: false
				value: ( path ) ->
					if not path? or path is undefined
						observe( origin, [savePath] )
					else
						observe( obj, [path] )
					return

		# default to observe everything in object
		keys = Object.keys( obj )

		for prop in keys
			do (prop) ->
				value = obj[prop]

				# build up path object
				path.push( prop )
				# define path as String not to pass by reference
				savePath = path.join(".")

				# only go forward if path is in whitelisted area
				if isInList( savePath, whitelist )
					# observe recursively if deep observe is turned on 
					if value? and ( isType( value, 'object') or isType( value, 'array') ) and deep is on
						observe( value, whitelist, extension, deep, origin, savePath )

					# otherwise observe object property
					# if deep observe is turned off, we cant observe objects and arrays
					else
						# define property in anonym function to avoid variable reference
						((origin, obj, prop, savePath)->
							Object.defineProperty obj, prop,
								enumerable: true
								configurable: true
								# getter remains the same
								get: () ->
									prop
								# setter modified to save old values to __History__ before setting the new one
								set: ( val ) ->
									step = path: savePath, value: prop
									origin.__History__.record step
									prop = val

							# set initial value
							obj[prop] = value

							# remove initial value set from history
							origin.__History__._backwards.pop()
							return
						)(origin, obj, prop, savePath)

				# remove last item from path to correct for next item
				path.pop()
				return
		return

	unobserve = (obj, blacklist, path) ->
		path = [] if not path? or path is undefined
		path = path.split( "." ) if not isType( path, "array" )

		for prop, val of obj
			do (prop, val) ->
				# build up path object
				path.push( prop )
				# define path as String not to pass by reference
				savePath = path.join(".")

				# continue only if path is blacklistable
				if isInList( savePath, blacklist )
					if val? and isType( val, "object" ) or isType( val, "array" )
						unobserve( val, blacklist, savePath )
					else
						# remove the history related properties
						delete obj.__History__ if obj.hasOwnProperty( "__History__" )
						delete obj.undo if obj.hasOwnProperty( "undo" )
						delete obj.redo if obj.hasOwnProperty( "redo" )
						delete obj.define if obj.hasOwnProperty( "define" )
						delete obj.remove if obj.hasOwnProperty( "remove" )
						delete obj.unobserve if obj.hasOwnProperty( "unobserve" )
						
						# redefine property with current value
						Object.defineProperty obj, prop,
							writable: true
							configurable: true
							enumerable: true
							value: val
				
				# remove last item from path to correct for next item
				path.pop()
				return
		return

	return {
		observe: observe
		unobserve: unobserve
	}
)