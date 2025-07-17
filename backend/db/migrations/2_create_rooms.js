export async function up(knex) {
  await knex.schema.createTable('rooms', (table) => {
    table.increments('id').primary();
    table.string('code').unique().notNullable();
    table.bigInteger('owner_id').notNullable();
    table.boolean('is_playing').defaultTo(false);
    table.float('current_time').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('rooms');
}