const Sequelize = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('product', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
        name: Sequelize.STRING,
        price: Sequelize.FLOAT,
        description: { type: Sequelize.STRING, allowNull: true },
        quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        // typeId: {
        //     type: Sequelize.INTEGER,
        //     allowNull: false,
        //     references: {
        //         model: 'product-types', // This is the table name of ProductType
        //         key: 'id',
        //     },
        //     onUpdate: 'CASCADE',
        //     onDelete: 'SET NULL',
        // }
    });
};