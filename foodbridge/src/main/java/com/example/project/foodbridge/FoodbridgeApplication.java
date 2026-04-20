package com.example.project.foodbridge;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FoodbridgeApplication {

	public static void main(String[] args) {
		SpringApplication.run(FoodbridgeApplication.class, args);
	}

}
