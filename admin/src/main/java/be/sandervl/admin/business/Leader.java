package be.sandervl.admin.business;

import com.foreach.across.modules.hibernate.business.SettableIdBasedEntity;
import com.foreach.across.modules.hibernate.id.AcrossSequenceGenerator;
import org.apache.commons.io.FileUtils;
import org.apache.tika.mime.MimeType;
import org.apache.tika.mime.MimeTypeException;
import org.apache.tika.mime.MimeTypes;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.validator.constraints.NotBlank;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.multipart.MultipartFile;

import javax.persistence.*;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.Size;
import java.io.File;
import java.io.IOException;
import java.util.Date;

@Entity
public class Leader extends SettableIdBasedEntity<Leader> {

    private static Logger LOG = LoggerFactory.getLogger(Leader.class);

    @Id
    @GeneratedValue(generator = "seq_leader_id")
    @GenericGenerator(
            name = "seq_leader_id",
            strategy = AcrossSequenceGenerator.STRATEGY,
            parameters = {
                    @org.hibernate.annotations.Parameter(name = "sequenceName", value = "seq_leader_id"),
                    @org.hibernate.annotations.Parameter(name = "allocationSize", value = "1")
            }
    )
    private Long id;

    @NotBlank
    @Size(max = 255)
    @Column(name="last_name")
    private String lastName;

    @NotBlank
    @Size(max = 255)
    @Column(name="first_name")
    private String firstName;

    @Column(name="birth_day")
    private Date birthDay;

    @Column(name = "street")
    @Size(max = 255)
    private String street;

    @Column(name = "number")
    @Size(max = 4)
    private String number;

    @Column(name = "city")
    @Size(max = 255)
    private String city;

    @Column(name = "zip_code")
    @Min(0)
    @Max(9999)
    private int zipCode;

    @Column(name="avatar", nullable=true)
    private String avatar;


    public Long getId() {
        return id;
    }

    @Override
    public void setId(Long id) {
        this.id = id;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public Date getBirthDay() {
        return birthDay;
    }

    public void setBirthDay(Date birthDay) {
        this.birthDay = birthDay;
    }

    public String getStreet() {
        return street;
    }

    public void setStreet(String street) {
        this.street = street;
    }

    public String getNumber() {
        return number;
    }

    public void setNumber(String number) {
        this.number = number;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public int getZipCode() {
        return zipCode;
    }

    public void setZipCode(int zipCode) {
        this.zipCode = zipCode;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    //    public void setAvatar(File avatar) {
//        this.avatar = avatar;
//    }

//    public void setAvatar(MultipartFile avatar) {
//        try {
//            MimeTypes allTypes = MimeTypes.getDefaultMimeTypes();
//            MimeType mimeType = allTypes.forName(avatar.getContentType());
//            File tmpFile = File.createTempFile(avatar.getName(), mimeType.getExtension());
//            FileUtils.copyInputStreamToFile(avatar.getInputStream(), tmpFile);
//            this.avatar = tmpFile.getName();
//        } catch (IOException e) {
//            LOG.error("Exception while opening uploaded file ",e.getMessage(), e.getStackTrace());
//        } catch (MimeTypeException e) {
//            LOG.error("Uploaded Content-type could not be found ", e.getMessage(), e.getStackTrace());
//        }
//    }
}
