export async function up(knex) {
  await knex.schema.createTable('room_users', (table) => {
    table.increments('id').primary();
    table.integer('room_id').references('id').inTable('rooms').onDelete('CASCADE');
    table.string('user_id'); // telegram id или сгенерированный id
    table.string('name').nullable();
    table.string('last_name').nullable();
    table.string('username').nullable();
    table.string('photo_url').nullable();
    table.string('source').defaultTo('web'); // 'telegram' или 'web'
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique(['room_id', 'user_id']);
  });
};

export async function down(knex) {
  await knex.schema.dropTableIfExists('room_users');
}