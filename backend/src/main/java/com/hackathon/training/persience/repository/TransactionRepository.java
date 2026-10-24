package com.hackathon.training.persience.repository;

import com.hackathon.training.domain.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserIdOrderByOperationDateDesc(Long userId);

    List<Transaction> findByUserIdAndOperationDateAfter(Long userId, java.time.LocalDate date);
    java.util.Optional<Transaction> findFirstByUserIdOrderByOperationDateDesc(Long userId);
}
