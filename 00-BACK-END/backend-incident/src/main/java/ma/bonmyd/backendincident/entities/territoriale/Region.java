package ma.bonmyd.backendincident.entities.territoriale;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Immutable;
import org.locationtech.jts.geom.MultiPolygon;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.io.WKTReader;
import org.locationtech.jts.io.WKTWriter;

import java.util.List;

@Entity
@Table(name = "regions")
@Data

public class Region {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private double area;
    private double perimeter;

    @Column(columnDefinition = "geometry(MultiPolygon, 4326)")
    @JsonIgnore
    private MultiPolygon geom;

    @OneToMany(mappedBy = "region")
    private List<Province> provinces;

    public String getGeom() {
        return new WKTWriter().write(geom);
    }

    public void setGeom(String wkt) {
        try {
            this.geom = (MultiPolygon) new WKTReader().read(wkt);
        } catch (Exception e) {
            throw new RuntimeException("Invalid WKT format", e);
        }
    }
}
