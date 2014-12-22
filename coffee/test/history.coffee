chai = require 'chai'

o = require '../src/history'

chai.should()
expect = chai.expect

describe "ObjectHistory", () ->

	before () ->
		@simple = 
			a: 1
			b: "test1"
			c: 1.234

		@deep = 
			a: 1
			b: [
				1, 2, 3
				[1, 2, 3]
				a: 1, b: 2, c: 3
			]
			c:
				d:
					e:
						f: 1

		return

	describe "#observe()", () ->

		it "should modify object to observable", () ->
			o.observe( @simple )

			@simple.should.have.property "__History__"
			@simple.should.have.property "undo"
			@simple.should.have.property "redo"

			return

		describe "undo", () ->

			it "should undo changes in simple object", () ->

				[@simple.a, @simple.b, @simple.c, @simple.a, @simple.a] = [2, "test2", 2.345, 3, 4]

				@simple.a.should.be.equal 4
				@simple.b.should.be.equal "test2"
				@simple.c.should.be.equal 2.345

				@simple.undo()
				@simple.a.should.be.equal 3
				@simple.b.should.be.equal "test2"
				@simple.c.should.be.equal 2.345

				@simple.undo()
				@simple.a.should.be.equal 2
				@simple.b.should.be.equal "test2"
				@simple.c.should.be.equal 2.345

				@simple.undo()
				@simple.a.should.be.equal 2
				@simple.b.should.be.equal "test2"
				@simple.c.should.be.equal 1.234

				@simple.undo()
				@simple.a.should.be.equal 2
				@simple.b.should.be.equal "test1"
				@simple.c.should.be.equal 1.234

				@simple.undo()
				@simple.a.should.be.equal 1
				@simple.b.should.be.equal "test1"
				@simple.c.should.be.equal 1.234

				return
			return

		describe "redo", () ->

			it "should redo changes in simple object", () ->

				@simple.a.should.be.equal 1
				@simple.b.should.be.equal "test1"
				@simple.c.should.be.equal 1.234

				@simple.redo()
				@simple.a.should.be.equal 2
				@simple.b.should.be.equal "test1"
				@simple.c.should.be.equal 1.234

				@simple.redo()
				@simple.a.should.be.equal 2
				@simple.b.should.be.equal "test2"
				@simple.c.should.be.equal 1.234

				@simple.redo()
				@simple.a.should.be.equal 2
				@simple.b.should.be.equal "test2"
				@simple.c.should.be.equal 2.345

				@simple.redo()
				@simple.a.should.be.equal 3
				@simple.b.should.be.equal "test2"
				@simple.c.should.be.equal 2.345

				@simple.redo()
				@simple.a.should.be.equal 4
				@simple.b.should.be.equal "test2"
				@simple.c.should.be.equal 2.345

			return
		return

	describe "#unobserve()", () ->

		it "should stop object from being observable", () ->
			o.unobserve( @simple )

			@simple.should.not.have.property "__History__"
			@simple.should.not.have.property "undo"
			@simple.should.not.have.property "redo"

		return

	describe "#observe() by whitelist", () ->

		it "should observe properties passed by (w/o extending)", () ->
			@simple = a: 1, b: "test1", c: 1.234

			o.observe( @simple, ["a", "c", "d", "e"] )

			@simple.should.not.have.property "d"
			@simple.should.not.have.property "e"

			[@simple.a, @simple.b, @simple.b, @simple.a, @simple.c, @simple.b, @simple.c] = [2, "test2", "test3", 3, 2.345, "test4", 3.456]

			@simple.a.should.be.equal 3
			@simple.b.should.be.equal "test4"
			@simple.c.should.be.equal 3.456

			@simple.undo()
			@simple.a.should.be.equal 3
			@simple.b.should.be.equal "test4"
			@simple.c.should.be.equal 2.345

			@simple.undo()
			@simple.a.should.be.equal 3
			@simple.b.should.be.equal "test4"
			@simple.c.should.be.equal 1.234

			@simple.undo()
			@simple.a.should.be.equal 2
			@simple.b.should.be.equal "test4"
			@simple.c.should.be.equal 1.234

			@simple.undo()
			@simple.a.should.be.equal 1
			@simple.b.should.be.equal "test4"
			@simple.c.should.be.equal 1.234

			@simple.redo()
			@simple.a.should.be.equal 2
			@simple.b.should.be.equal "test4"
			@simple.c.should.be.equal 1.234

			@simple.redo()
			@simple.a.should.be.equal 3
			@simple.b.should.be.equal "test4"
			@simple.c.should.be.equal 1.234

			@simple.redo()
			@simple.a.should.be.equal 3
			@simple.b.should.be.equal "test4"
			@simple.c.should.be.equal 2.345

			@simple.redo()
			@simple.a.should.be.equal 3
			@simple.b.should.be.equal "test4"
			@simple.c.should.be.equal 3.456

			o.unobserve( @simple )
			return

		it "should observe properties passed by (w/ extending)", () ->
			@simple = a: 1, b: "test1", c: 1.234

			o.observe( @simple, ["a", "c", "d", "e"], on )

			
			@simple.a = 2 
			@simple.b = "test2"
			@simple.d = 5
			@simple.e = 9
			@simple.b = "test3"
			@simple.a = 3
			@simple.c = 2.345
			@simple.b = "test4"
			@simple.c = 3.456
			@simple.d = 6

			@simple.a.should.be.equal 3
			@simple.b.should.be.equal "test4"
			@simple.c.should.be.equal 3.456
			@simple.d.should.be.equal 6
			@simple.e.should.be.equal 9

			@simple.undo()
			@simple.a.should.be.equal 3
			@simple.b.should.be.equal "test4"
			@simple.c.should.be.equal 3.456
			@simple.d.should.be.equal 5
			@simple.e.should.be.equal 9

			@simple.undo()
			@simple.a.should.be.equal 3
			@simple.b.should.be.equal "test4"
			@simple.c.should.be.equal 2.345
			@simple.d.should.be.equal 5
			@simple.e.should.be.equal 9

			@simple.undo()
			@simple.a.should.be.equal 3
			@simple.b.should.be.equal "test4"
			@simple.c.should.be.equal 1.234
			@simple.d.should.be.equal 5
			@simple.e.should.be.equal 9

			@simple.undo()
			@simple.a.should.be.equal 2
			@simple.b.should.be.equal "test4"
			@simple.c.should.be.equal 1.234
			@simple.d.should.be.equal 5
			@simple.e.should.be.equal 9

			@simple.undo()
			@simple.a.should.be.equal 2
			@simple.b.should.be.equal "test4"
			@simple.c.should.be.equal 1.234
			@simple.d.should.be.equal 5
			expect(@simple.e).to.be.null

			@simple.undo()
			@simple.a.should.be.equal 2
			@simple.b.should.be.equal "test4"
			@simple.c.should.be.equal 1.234
			expect(@simple.d).to.be.null
			expect(@simple.e).to.be.null

			@simple.undo()
			@simple.a.should.be.equal 1
			@simple.b.should.be.equal "test4"
			@simple.c.should.be.equal 1.234
			expect(@simple.d).to.be.null
			expect(@simple.e).to.be.null

			return
		return

	describe "#deepObserve()", () ->

		it "should observe object tree"

		return

	describe "#multiObserve()", () ->

		it "should observe multiple objects"

		return
	return