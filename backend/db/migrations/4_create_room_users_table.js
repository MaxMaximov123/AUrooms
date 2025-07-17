export async function up(knex) {
  await knex.schema.createTable('room_users', (table) => {
    table.increments('id').primary();
    table.integer('room_id').unsigned().notNullable().references('id').inTable('rooms').onDelete('CASCADE');
    table.integer('user_id').notNullable();
    table.string('name').notNullable();
    table.string('last_name').defaultTo('');
    table.string('photo_url').defaultTo('https://cdn-icons-png.flaticon.com/512/1077/1077063.png');
    table.boolean('is_telegram').defaultTo(false);
    table.timestamp('joined_at').defaultTo(knex.fn.now());
    
    table.unique(['room_id', 'user_id']);
    table.index(['room_id']);
  });
};

export async function down(knex) {
  await knex.schema.dropTableIfExists('room_users');
}