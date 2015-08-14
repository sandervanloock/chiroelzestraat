package be.sandervl.admin.config;

import be.sandervl.admin.ChiroAdminModule;
import be.sandervl.admin.controllers.LeaderController;
import com.foreach.across.modules.hibernate.jpa.config.HibernateJpaConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(transactionManagerRef = HibernateJpaConfiguration.TRANSACTION_MANAGER, basePackageClasses = ChiroAdminModule.class)
@ComponentScan({"be.sandervl.admin.services,be.sandervl.admin.controllers"})
public class ChiroAdminConfiguration {




}
