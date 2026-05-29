
class BaseVector {
	_value = [0, 0, 0];
	get value() {
		return this._value;
	}
	
	get length() {
		return Math.sqrt(this.dotProduct(this));
	}
	set length(_l) {
		this.scale(_l / this.length);
	}

	get lengthSquared() {
		return this.dotProduct(this);
	}
	get unitary() {
		let len = this.length;
		if (len === 0) return this.copy();
		return this.copy().scale(1 / len);
	}

	constructor() {
		this._value = [...arguments];
	}

	copy() {
		return new this.constructor(...this._value);
	}


	projectOnTo(_Vec) {
		if (_Vec.unitary.lengthSquared === 0) return this.copy();
		return _Vec.unitary.scale(this.dotProduct(_Vec.unitary));
	}

	subtract(_vec) {
		return this.add(_vec.copy().scale(-1));
	}
}


export class Vector2D extends BaseVector {
	get x() {return this._value[0]}
	get y() {return this._value[1]}
	set x(_x) {this._value[0] = _x}
	set y(_y) {this._value[1] = _y}

	static get random() {
		return new this(Math.random() * 2 - 1, Math.random() * 2 - 1);
	}
	static get empty() {
		return new this(0, 0);
	}

	get angle() {
		return Math.atan2(this.y, this.x);
	}
	set angle(_angle) {
		let oldLength = this.length;
		this.x = oldLength * Math.cos(_angle % (2 * Math.PI));
		this.y = oldLength * Math.sin(_angle % (2 * Math.PI));
	}
	get perpendicular() {
		return new Vector2D(-this.y, this.x);
	}

	dotProduct(_vec) {
		return _vec.x * this.x + _vec.y * this.y;
	}
		

	add(_vec) {
		this.x += _vec.x;
		this.y += _vec.y;
		return this;
	}
	difference(_vec) { // Defined as: the result is how you get from this to _vec
		return new Vector2D(
			_vec.x - this.x,
			_vec.y - this.y
		);
	}
	
	scale(_scalar) {
		this.x *= _scalar;
		this.y *= _scalar;
		return this;
	}

	multiply(_vec) {
		this.x *= _vec.x;
		this.y *= _vec.y
		return this;
	}
	

	rotate(_angle) {
		this.angle = this.angle + _angle;
		return this;
	}
}


export default Vector2D

export class Vector3D extends Vector2D {
	get z() {return this._value[2]}
	set z(_z) {this._value[2] = _z}

	static get random() {
		return new this(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
	}
	static get empty() {
		return new this(0, 0, 0);
	}
	get D2() {
		return new Vector2D(this.x, this.y);
	}

	get angle() {
		return new Vector2D(
			Math.atan2(this.y, this.x), 
			Math.atan2(this.z, Math.sqrt(this.x**2 + this.y**2))
		);
	}

	set angle(_angleVec) {
		let oldLength = this.length;
		let new2DLength = oldLength * Math.cos(_angleVec.y % (2 * Math.PI));
		this.x = new2DLength * Math.cos(_angleVec.x % (2 * Math.PI));
		this.y = new2DLength * Math.sin(_angleVec.x % (2 * Math.PI));
		this.z = oldLength * Math.sin(_angleVec.y % (2 * Math.PI));
	}
	
	dotProduct(_vec) {
		return _vec.x * this.x + _vec.y * this.y + _vec.z * this.z;
	}

	add(_vec) {
		this.x += _vec.x;
		this.y += _vec.y;
		this.z += _vec.z;
		return this;
	}
	difference(_vec) { // Defined as: the result is how you get from this to _vec
		return new Vector3D(
			_vec.x - this.x,
			_vec.y - this.y,
			_vec.z - this.z
		);
	}
	
	scale(_scalar) {
		this.x *= _scalar;
		this.y *= _scalar;
		this.z *= _scalar;
		return this;
	}
}

