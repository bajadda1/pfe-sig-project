package ma.bonmyd.backendincident.security;


import jakarta.servlet.DispatcherType;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final AuthenticationProvider authenticationProvider;

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    private final AuthenticationEntryPoint authenticationEntryPoint;

    @Autowired
    public SecurityConfig(AuthenticationProvider authenticationProvider, JwtAuthenticationFilter jwtAuthenticationFilter, AuthenticationEntryPoint authenticationEntryPoint) {
        this.authenticationProvider = authenticationProvider;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    @Value("${auth.api}")
    private String authApi;

    @Value("${citizen.api}")
    private String citizenApi;

    @Value("${sector.api}")
    private String sectorApi;

    @Value("${type.api}")
    private String typeApi;

    @Value("${incident.api}")
    private String incidentApi;

    @Value("${region.api}")
    private String regionApi;

    @Value("${province.api}")
    private String provinceApi;

    @Value("${role.api}")
    private String roleApi;

    @Value("${user.api}")
    private String userApi;

    @Value("${stats.api}")
    private String statsApi;


    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {

        http.
                cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(
                        req -> req.requestMatchers(
                                        "/v2/api-docs",
                                        "/v3/api-docs",
                                        "/v3/api-docs/**",
                                        "/swagger-resources",
                                        "/swagger-resources/**",
                                        "/configuration/ui",
                                        "/configuration/security",
                                        "/swagger-ui/**",
                                        "/webjars/**",
                                        "/swagger-ui.html"
                                )
                                .permitAll()
                                .requestMatchers(authApi + "/login").permitAll()
                                .requestMatchers(authApi + "/register").permitAll()
                                .requestMatchers(HttpMethod.GET, "/**").permitAll()
                                .requestMatchers(statsApi + "/**").permitAll()

                                .requestMatchers(HttpMethod.GET, sectorApi + "/**").permitAll()

                                .requestMatchers(HttpMethod.GET, typeApi + "/**").permitAll()

                                .requestMatchers(HttpMethod.GET, regionApi + "/**").permitAll()
                                .requestMatchers(HttpMethod.GET, provinceApi + "/**").permitAll()
                                .requestMatchers(incidentApi + "/**").permitAll()

                                .requestMatchers(HttpMethod.GET, roleApi + "/**").permitAll()
                                //==== || endpoints without auth ^^^ ABOVE ||

                                .requestMatchers(userApi + "/me").authenticated()
                                //=== || endpoints with only auth ^^^  ABOVE ||

                                .requestMatchers(userApi + "/**").permitAll()
//                            .hasAuthority("admin")
                                .requestMatchers(sectorApi + "/**").permitAll()
//                            .hasAuthority("admin".toLowerCase())
                                .requestMatchers(typeApi + "/**").permitAll()
//                            .hasAuthority("admin".toLowerCase())
                                .requestMatchers(roleApi + "/**").permitAll()
//                            .hasAuthority("admin".toLowerCase())
                                //endpoints with both auth and admin role ^^^  ABOVE

//                                .requestMatchers(incidentApi + "/**").hasAuthority("admin")

                                .requestMatchers(citizenApi + "/**").permitAll()

                                .dispatcherTypeMatchers(DispatcherType.FORWARD, DispatcherType.ERROR).permitAll()
                                .anyRequest()  //other endpoints need auth
                                .authenticated()


                )

//                .exceptionHandling(customizer -> customizer.authenticationEntryPoint((request, response, authException) -> {
//                    // Let exceptions propagate and be handled by @ControllerAdvice
//                    throw authException;
//                }))

                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(this.authenticationProvider)
                .addFilterBefore(this.jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        // Use the custom entry point
        return http.build();

    }
}
