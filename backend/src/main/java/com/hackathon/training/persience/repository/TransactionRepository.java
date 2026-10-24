package com.hackathon.training.persience.repository;

import com.hackathon.training.domain.model.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId AND t.operationDate > :date ORDER BY t.operationDate DESC")
    List<Transaction> findRecentTransactions(@Param("userId") Long userId, @Param("date") LocalDate date);

    Page<Transaction> findByUserIdOrderByOperationDateDesc(Long userId, Pageable pageable);

    List<Transaction> findByUserIdAndOperationDateAfter(Long userId, LocalDate date);

    Optional<Transaction> findFirstByUserIdOrderByOperationDateDesc(Long userId);
}
