// It adds custom function to alasql.


/**
 * Arccosine.
 */
alasql.fn.ACOS = function(x)
{
    return Math.acos(x);
};

/**
 * Hyperbolic arccosine.
 */
alasql.fn.ACOSH = function(x)
{
    return Math.acosh(x);
};

/**
 * Arcsine.
 */
alasql.fn.ASIN = function(x)
{
    return Math.asin(x);
};

/**
 * Hyperbolic arcsine.
 */
alasql.fn.ASINH = function(x)
{
    return Math.asinh(x);
};

/**
 * Arctangent.
 */
alasql.fn.ATAN = function(x)
{
    return Math.atan(x);
};

/**
 * Hyperbolic arctangent.
 */
alasql.fn.ATANH = function(x)
{
    return Math.atanh(x);
};

/**
 * Cube root.
 */
alasql.fn.CBRT = function(x)
{
    return Math.cbrt(x);
};


/**
 * Cosine
 */
alasql.fn.COS = function(x)
{
    return Math.cos(x);
};

/**
 * Hyperbolic cosine
 */
alasql.fn.COSH = function(x)
{
    return Math.cosh(x);
};

/**
 * Nearest single precision float representation of a number
 */
alasql.fn.FROUND = function(x)
{
    return Math.fround(x);
};

/**
 * Natural logarithm
 */
alasql.fn.LN = function(x)
{
    return Math.log(x);
};

/**
 * Natural logarithm of 1 + x
 */
alasql.fn.LN1P = function(x)
{
    return Math.log1p(x);
};

/**
 * Logarithm base 10 of x
 */
alasql.fn.LOG10 = function(x)
{
    return Math.log10(x);
};

/**
 * Logarithm base 2 of x
 */
alasql.fn.LOG2 = function(x)
{
    return Math.log2(x);
};

/**
 * Sign of the x, indicating whether x is positive, negative or zero
 */
alasql.fn.SIGN = function(x)
{
    return Math.sign(x);
};

/**
 * Sine.
 */
alasql.fn.SIN = function(x)
{
    return Math.sin(x);
};

/**
 * Hyperbolic sine.
 */
alasql.fn.SINH = function(x)
{
    return Math.sinh(x);
};

/**
 * Tangent.
 */
alasql.fn.TAN = function(x)
{
    return Math.tan(x);
};

/**
 * Hyperbolic tangent.
 */
alasql.fn.TANH = function(x)
{
    return Math.tanh(x);
};

/**
 * Returns the integral part of the number x, removing any fractional digits
 */
alasql.fn.TRUNC = function(x)
{
    return Math.trunc(x);
};
