const middlewares1 = async (ctx, next) => {
    try {
        console.log(ctx, "=====ctx");
        ctx.params.productId = 1
        await next(); // Proceed with the next middleware or handler
    } catch (error) {
        ctx.status = error.status || 500;
        ctx.body = error.message || 'Internal Server Error';
        // Optionally, log the error or handle it further
    }
}

module.exports = { middlewares1 };