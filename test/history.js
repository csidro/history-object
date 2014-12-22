var chai, expect, o;

chai = require('chai');

o = require('../src/history');

chai.should();

expect = chai.expect;

describe("ObjectHistory", function() {
  before(function() {
    this.simple = {
      a: 1,
      b: "test1",
      c: 1.234
    };
    this.deep = {
      a: 1,
      b: [
        1, 2, 3, [1, 2, 3], {
          a: 1,
          b: 2,
          c: 3
        }
      ],
      c: {
        d: {
          e: {
            f: 1
          }
        }
      }
    };
  });
  describe("#observe()", function() {
    it("should modify object to observable", function() {
      o.observe(this.simple);
      this.simple.should.have.property("__History__");
      this.simple.should.have.property("undo");
      this.simple.should.have.property("redo");
    });
    describe("undo", function() {
      it("should undo changes in simple object", function() {
        var _ref;
        _ref = [2, "test2", 2.345, 3, 4], this.simple.a = _ref[0], this.simple.b = _ref[1], this.simple.c = _ref[2], this.simple.a = _ref[3], this.simple.a = _ref[4];
        this.simple.a.should.be.equal(4);
        this.simple.b.should.be.equal("test2");
        this.simple.c.should.be.equal(2.345);
        this.simple.undo();
        this.simple.a.should.be.equal(3);
        this.simple.b.should.be.equal("test2");
        this.simple.c.should.be.equal(2.345);
        this.simple.undo();
        this.simple.a.should.be.equal(2);
        this.simple.b.should.be.equal("test2");
        this.simple.c.should.be.equal(2.345);
        this.simple.undo();
        this.simple.a.should.be.equal(2);
        this.simple.b.should.be.equal("test2");
        this.simple.c.should.be.equal(1.234);
        this.simple.undo();
        this.simple.a.should.be.equal(2);
        this.simple.b.should.be.equal("test1");
        this.simple.c.should.be.equal(1.234);
        this.simple.undo();
        this.simple.a.should.be.equal(1);
        this.simple.b.should.be.equal("test1");
        this.simple.c.should.be.equal(1.234);
      });
    });
    describe("redo", function() {
      it("should redo changes in simple object", function() {
        this.simple.a.should.be.equal(1);
        this.simple.b.should.be.equal("test1");
        this.simple.c.should.be.equal(1.234);
        this.simple.redo();
        this.simple.a.should.be.equal(2);
        this.simple.b.should.be.equal("test1");
        this.simple.c.should.be.equal(1.234);
        this.simple.redo();
        this.simple.a.should.be.equal(2);
        this.simple.b.should.be.equal("test2");
        this.simple.c.should.be.equal(1.234);
        this.simple.redo();
        this.simple.a.should.be.equal(2);
        this.simple.b.should.be.equal("test2");
        this.simple.c.should.be.equal(2.345);
        this.simple.redo();
        this.simple.a.should.be.equal(3);
        this.simple.b.should.be.equal("test2");
        this.simple.c.should.be.equal(2.345);
        this.simple.redo();
        this.simple.a.should.be.equal(4);
        this.simple.b.should.be.equal("test2");
        return this.simple.c.should.be.equal(2.345);
      });
    });
  });
  describe("#unobserve()", function() {
    it("should stop object from being observable", function() {
      o.unobserve(this.simple);
      this.simple.should.not.have.property("__History__");
      this.simple.should.not.have.property("undo");
      return this.simple.should.not.have.property("redo");
    });
  });
  describe("#observe() by whitelist", function() {
    it("should observe properties passed by (w/o extending)", function() {
      var _ref;
      this.simple = {
        a: 1,
        b: "test1",
        c: 1.234
      };
      o.observe(this.simple, ["a", "c", "d", "e"]);
      this.simple.should.not.have.property("d");
      this.simple.should.not.have.property("e");
      _ref = [2, "test2", "test3", 3, 2.345, "test4", 3.456], this.simple.a = _ref[0], this.simple.b = _ref[1], this.simple.b = _ref[2], this.simple.a = _ref[3], this.simple.c = _ref[4], this.simple.b = _ref[5], this.simple.c = _ref[6];
      this.simple.a.should.be.equal(3);
      this.simple.b.should.be.equal("test4");
      this.simple.c.should.be.equal(3.456);
      this.simple.undo();
      this.simple.a.should.be.equal(3);
      this.simple.b.should.be.equal("test4");
      this.simple.c.should.be.equal(2.345);
      this.simple.undo();
      this.simple.a.should.be.equal(3);
      this.simple.b.should.be.equal("test4");
      this.simple.c.should.be.equal(1.234);
      this.simple.undo();
      this.simple.a.should.be.equal(2);
      this.simple.b.should.be.equal("test4");
      this.simple.c.should.be.equal(1.234);
      this.simple.undo();
      this.simple.a.should.be.equal(1);
      this.simple.b.should.be.equal("test4");
      this.simple.c.should.be.equal(1.234);
      this.simple.redo();
      this.simple.a.should.be.equal(2);
      this.simple.b.should.be.equal("test4");
      this.simple.c.should.be.equal(1.234);
      this.simple.redo();
      this.simple.a.should.be.equal(3);
      this.simple.b.should.be.equal("test4");
      this.simple.c.should.be.equal(1.234);
      this.simple.redo();
      this.simple.a.should.be.equal(3);
      this.simple.b.should.be.equal("test4");
      this.simple.c.should.be.equal(2.345);
      this.simple.redo();
      this.simple.a.should.be.equal(3);
      this.simple.b.should.be.equal("test4");
      this.simple.c.should.be.equal(3.456);
      o.unobserve(this.simple);
    });
    it("should observe properties passed by (w/ extending)", function() {
      this.simple = {
        a: 1,
        b: "test1",
        c: 1.234
      };
      o.observe(this.simple, ["a", "c", "d", "e"], true, false);
      this.simple.a = 2;
      this.simple.b = "test2";
      this.simple.d = 5;
      this.simple.e = 9;
      this.simple.b = "test3";
      this.simple.a = 3;
      this.simple.c = 2.345;
      this.simple.b = "test4";
      this.simple.c = 3.456;
      this.simple.d = 6;
      this.simple.a.should.be.equal(3);
      this.simple.b.should.be.equal("test4");
      this.simple.c.should.be.equal(3.456);
      this.simple.d.should.be.equal(6);
      this.simple.e.should.be.equal(9);
      this.simple.undo();
      this.simple.a.should.be.equal(3);
      this.simple.b.should.be.equal("test4");
      this.simple.c.should.be.equal(3.456);
      this.simple.d.should.be.equal(5);
      this.simple.e.should.be.equal(9);
      this.simple.undo();
      this.simple.a.should.be.equal(3);
      this.simple.b.should.be.equal("test4");
      this.simple.c.should.be.equal(2.345);
      this.simple.d.should.be.equal(5);
      this.simple.e.should.be.equal(9);
      this.simple.undo();
      this.simple.a.should.be.equal(3);
      this.simple.b.should.be.equal("test4");
      this.simple.c.should.be.equal(1.234);
      this.simple.d.should.be.equal(5);
      this.simple.e.should.be.equal(9);
      this.simple.undo();
      this.simple.a.should.be.equal(2);
      this.simple.b.should.be.equal("test4");
      this.simple.c.should.be.equal(1.234);
      this.simple.d.should.be.equal(5);
      this.simple.e.should.be.equal(9);
      this.simple.undo();
      this.simple.a.should.be.equal(2);
      this.simple.b.should.be.equal("test4");
      this.simple.c.should.be.equal(1.234);
      this.simple.d.should.be.equal(5);
      expect(this.simple.e).to.be["null"];
      this.simple.undo();
      this.simple.a.should.be.equal(2);
      this.simple.b.should.be.equal("test4");
      this.simple.c.should.be.equal(1.234);
      expect(this.simple.d).to.be["null"];
      expect(this.simple.e).to.be["null"];
      this.simple.undo();
      this.simple.a.should.be.equal(1);
      this.simple.b.should.be.equal("test4");
      this.simple.c.should.be.equal(1.234);
      expect(this.simple.d).to.be["null"];
      expect(this.simple.e).to.be["null"];
    });
  });
  describe("#deepObserve()", function() {
    it("should observe object tree");
  });
  describe("#multiObserve()", function() {
    it("should observe multiple objects");
  });
});
