export async function up(knex) {
  await knex.schema.createTable('tracks', (table) => {
    table.increments('id').primary();
    table.integer('room_id').references('id').inTable('rooms').onDelete('CASCADE');
    table.integer('order');
    table.string('track_id');
    table.string('title');
    table.text('src');
    table.text('cover');
    table.text('artists');
    table.string('type');
    table.boolean('is_playing').defaultTo(false);
    table.float('current_time').defaultTo(0);
    table.float('duration').defaultTo(0);
    table.timestamp('added_at').defaultTo(knex.fn.now());
    // table.unique(['room_id', 'order']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('tracks');
}