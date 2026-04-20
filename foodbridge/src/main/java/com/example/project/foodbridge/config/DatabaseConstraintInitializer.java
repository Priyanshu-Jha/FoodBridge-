package com.example.project.foodbridge.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseConstraintInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseConstraintInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        // Keep status check constraint aligned with enum values used in application
        // code.
        jdbcTemplate.execute("""
                DO $$
                BEGIN
                    ALTER TABLE food_listings DROP CONSTRAINT IF EXISTS food_listings_status_check;

                    ALTER TABLE food_listings
                        ADD CONSTRAINT food_listings_status_check
                        CHECK (status IN ('AVAILABLE', 'CLAIMED', 'COMPLETED', 'CANCELLED', 'EXPIRED'));
                EXCEPTION
                    WHEN undefined_table THEN
                        -- Skip for fresh startup stages before Hibernate creates tables.
                        NULL;
                END $$;
                """);
    }
}
